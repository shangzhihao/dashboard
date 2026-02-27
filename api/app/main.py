"""FastAPI entrypoint for the dashboard backend."""

from __future__ import annotations

from calendar import monthrange
from datetime import date
from datetime import datetime
from functools import lru_cache
import json
from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pyarrow.compute as pc
import pyarrow.parquet as pq

SERIES_COLORS: tuple[str, ...] = (
    "#e4002b",
    "#f47b7b",
    "#9f1f5c",
    "#ef9020",
    "#00af3e",
    "#85b7e2",
    "#29245c",
    "#ffd616",
    "#e5352b",
    "#e990ab",
    "#0081b4",
    "#96cbb3",
    "#91be3e",
    "#39a6dd",
    "#eb0973",
    "#969491",
    "#333c41",
    "#74d2e7",
    "#48a9c5",
    "#0085ad",
    "#8db9ca",
    "#4298b5",
    "#005670",
    "#00205b",
    "#009f4d",
    "#84bd00",
    "#efdf00",
    "#fe5000",
    "#da1884",
    "#a51890",
    "#0077c8",
    "#008eaa",
    "#949483",
)

app = FastAPI(
    title="Futures Dashboard API",
    description="Backend service for dashboard metadata and chart data.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def data_root() -> Path:
    """Resolve dashboard static data root."""
    return Path(__file__).resolve().parents[2] / "web" / "public" / "data"


def load_json(path: Path) -> object:
    """Load JSON payload from file."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail="Missing source data file") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail="Invalid source data format") from exc


def extract_leaf_categories(items: list[dict[str, object]]) -> set[str]:
    """Extract leaf category keys from nested categories payload."""
    leaf_keys: set[str] = set()
    for item in items:
        key = item.get("key")
        children = item.get("children")
        if isinstance(children, list) and children:
            child_items = [entry for entry in children if isinstance(entry, dict)]
            leaf_keys.update(extract_leaf_categories(child_items))
            continue
        if isinstance(key, str):
            leaf_keys.add(key)
    return leaf_keys


@lru_cache(maxsize=1)
def valid_categories() -> set[str]:
    """Load and cache valid leaf category keys."""
    payload = load_json(data_root() / "categories.json")
    items = payload if isinstance(payload, list) else []
    dict_items = [entry for entry in items if isinstance(entry, dict)]
    return extract_leaf_categories(dict_items)


def normalize_contract_key(contract: str) -> str | None:
    """Normalize filter contract key to API contract month (01-12)."""
    if contract.startswith("c") and len(contract) == 3 and contract[1:].isdigit():
        return contract[1:]
    if len(contract) == 2 and contract.isdigit():
        return contract
    return None


@lru_cache(maxsize=1)
def metric_contracts() -> dict[str, set[str]]:
    """Load and cache allowed contracts per metric."""
    payload = load_json(data_root() / "filters.json")
    if not isinstance(payload, dict):
        return {}
    metrics = payload.get("metrics")
    if not isinstance(metrics, list):
        return {}

    mapping: dict[str, set[str]] = {}
    for metric in metrics:
        if not isinstance(metric, dict):
            continue
        metric_key = metric.get("key")
        contract_keys = metric.get("contractKeys")
        if not isinstance(metric_key, str) or not isinstance(contract_keys, list):
            continue
        normalized_contracts = {
            normalized
            for entry in contract_keys
            if isinstance(entry, str)
            for normalized in [normalize_contract_key(entry)]
            if normalized is not None
        }
        mapping[metric_key] = normalized_contracts
    return mapping


def validate_request(metric: str, category: str, contract: str) -> None:
    """Validate request path values against supported config."""
    mapping = metric_contracts()
    if metric not in mapping:
        raise HTTPException(status_code=404, detail="Unknown metric")
    if category not in valid_categories():
        raise HTTPException(status_code=404, detail="Unknown category")
    if contract not in mapping[metric]:
        raise HTTPException(status_code=404, detail="Unknown contract")


def project_root() -> Path:
    """Resolve repository root path."""
    return Path(__file__).resolve().parents[2]


def futures_parquet_path() -> Path:
    """Resolve futures parquet file path."""
    return project_root() / "data" / "futures.parquet"


@lru_cache(maxsize=1)
def futures_table():
    """Load futures parquet data once per process."""
    path = futures_parquet_path()
    try:
        return pq.read_table(
            path,
            columns=["item", "year", "month", "eob", "close", "volume"],
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail="Missing futures parquet file") from exc


def metric_column(metric: str) -> str:
    """Resolve metric to source parquet column."""
    if metric == "price":
        return "close"
    if metric == "positions":
        # Dataset currently has no open-interest column; use volume for positions.
        return "volume"
    raise HTTPException(status_code=404, detail="Unknown metric")


def contract_month_value(contract: str) -> int:
    """Parse and validate contract month (01-12)."""
    if len(contract) != 2 or not contract.isdigit():
        raise HTTPException(status_code=404, detail="Unknown contract")
    month = int(contract)
    if month < 1 or month > 12:
        raise HTTPException(status_code=404, detail="Unknown contract")
    return month


def parse_eob_date(value: Any) -> date | None:
    """Parse eob string to date."""
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value).date()
    except ValueError:
        return None


def normalized_value(value: Any, metric: str) -> int | float | None:
    """Normalize metric value for response payload."""
    if value is None:
        return None
    if metric == "positions":
        try:
            return int(value)
        except (TypeError, ValueError):
            return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def month_day_key(value: date) -> str:
    """Format one date value as MM-DD."""
    return value.strftime("%m-%d")


def month_day_sort_key(value: str, start_month: int) -> tuple[int, int]:
    """Sort MM-DD values starting from contract month (seasonal order)."""
    month_text, day_text = value.split("-", maxsplit=1)
    month = int(month_text)
    day = int(day_text)
    season_month_index = (month - start_month) % 12
    return (season_month_index, day)


def matching_rows(metric: str, category: str, contract: str) -> list[dict[str, Any]]:
    """Load and normalize rows for one item + contract-month."""
    table = futures_table()
    mask = pc.and_(
        pc.equal(table["item"], category),
        pc.equal(table["month"], contract),
    )
    filtered = table.filter(mask)
    if filtered.num_rows == 0:
        raise HTTPException(status_code=404, detail="No data for category/contract")

    value_column = metric_column(metric)
    rows: list[dict[str, Any]] = []
    for year_raw, eob_raw, value_raw in zip(
        filtered["year"].to_pylist(),
        filtered["eob"].to_pylist(),
        filtered[value_column].to_pylist(),
    ):
        if year_raw is None:
            continue
        try:
            series_year = int(str(year_raw))
        except ValueError:
            continue

        eob_day = parse_eob_date(eob_raw)
        metric_value = normalized_value(value_raw, metric)
        if eob_day is None or metric_value is None:
            continue
        rows.append(
            {
                "series_year": series_year,
                "eob": eob_day,
                "value": metric_value,
            }
        )

    if not rows:
        raise HTTPException(status_code=404, detail="No valid rows after normalization")
    return rows


def seasonal_chart_payload(metric: str, category: str, contract: str) -> dict[str, object]:
    """Build chart payload using futures parquet rows."""
    contract_month = contract_month_value(contract)
    rows = matching_rows(metric, category, contract)
    available_years = sorted({entry["series_year"] for entry in rows}, reverse=True)

    by_date: dict[str, dict[str, object]] = {}
    series: list[dict[str, object]] = []
    series_index = 0

    for series_year in available_years:
        start_date = date(series_year - 1, contract_month, 1)
        end_date = date(series_year, contract_month, monthrange(series_year, contract_month)[1])

        window_rows = [
            entry
            for entry in rows
            if entry["series_year"] == series_year
            and start_date <= entry["eob"] <= end_date
        ]
        if not window_rows:
            continue

        series_key = f"y{series_year}{contract}"
        series.append(
            {
                "key": series_key,
                "label": f"{series_year}-{contract}",
                "type": "line",
                "yAxisId": "left",
                "color": SERIES_COLORS[series_index % len(SERIES_COLORS)],
                "strokeWidth": 2,
            }
        )
        series_index += 1

        for entry in window_rows:
            day_key = month_day_key(entry["eob"])
            row = by_date.setdefault(day_key, {"date": day_key})
            # Keep the first value for duplicated MM-DD in the same contract-year window.
            if series_key not in row:
                row[series_key] = entry["value"]

    if not series:
        raise HTTPException(status_code=404, detail="No seasonal series for request")

    start_day = f"{contract}-01"
    by_date.setdefault(start_day, {"date": start_day})

    items = [
        by_date[day]
        for day in sorted(
            by_date,
            key=lambda day: month_day_sort_key(day, contract_month),
        )
    ]
    axis_label = "价格" if metric == "price" else "持仓(手)"
    axis_label_key = "chart.axes.left.price" if metric == "price" else "chart.axes.left.positions"

    return {
        "axes": {"left": {"label": axis_label, "labelKey": axis_label_key}},
        "series": series,
        "items": items,
    }


@lru_cache(maxsize=4096)
def chart_payload(metric: str, category: str, contract: str) -> dict[str, object]:
    """Generate and cache chart payload for one request tuple."""
    return seasonal_chart_payload(metric, category, contract)


def monthly_change_payload(category: str, contract: str) -> dict[str, object]:
    """Build monthly percentage change table for one category + contract."""
    contract_month = contract_month_value(contract)
    rows = matching_rows("price", category, contract)
    available_years = sorted({entry["series_year"] for entry in rows})
    items: list[dict[str, object]] = []

    for series_year in available_years:
        start_date = date(series_year - 1, contract_month, 1)
        end_date = date(series_year, contract_month, monthrange(series_year, contract_month)[1])
        window_rows = sorted(
            [
                entry
                for entry in rows
                if entry["series_year"] == series_year
                and start_date <= entry["eob"] <= end_date
            ],
            key=lambda entry: entry["eob"],
        )
        if not window_rows:
            continue

        month_first_year_month: dict[int, tuple[int, int]] = {}
        month_ohlc: dict[tuple[int, int], dict[str, float]] = {}
        for entry in window_rows:
            eob_day = entry["eob"]
            value = float(entry["value"])
            year_month = (eob_day.year, eob_day.month)
            if eob_day.month not in month_first_year_month:
                month_first_year_month[eob_day.month] = year_month
            bucket = month_ohlc.setdefault(
                year_month,
                {"open": value, "close": value},
            )
            bucket["close"] = value

        row: dict[str, object] = {"year": str(series_year % 100)}
        for month in range(1, 13):
            key = f"m{month:02d}"
            year_month = month_first_year_month.get(month)
            if year_month is None:
                row[key] = None
                continue
            bucket = month_ohlc.get(year_month)
            if not bucket or bucket["open"] == 0:
                row[key] = None
                continue
            row[key] = round((bucket["close"] - bucket["open"]) / bucket["open"] * 100, 2)
        items.append(row)

    if not items:
        raise HTTPException(status_code=404, detail="No monthly change rows for request")

    return {"items": items}


@lru_cache(maxsize=4096)
def cached_monthly_change_payload(category: str, contract: str) -> dict[str, object]:
    """Generate and cache monthly change table payload."""
    return monthly_change_payload(category, contract)


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint used by local/dev environments."""
    return {"status": "ok"}


@app.get("/data/futures/monthly-change/{category}/{contract}.json")
async def futures_monthly_change(category: str, contract: str) -> dict[str, object]:
    """Return monthly percentage change table by category and contract."""
    if category not in valid_categories():
        raise HTTPException(status_code=404, detail="Unknown category")
    contract_month_value(contract)
    return cached_monthly_change_payload(category, contract)


@app.get("/data/futures/{metric}/{category}/{contract}.json")
async def chart_futures_data(metric: str, category: str, contract: str) -> dict[str, object]:
    """Return chart payload by route params from futures parquet."""
    validate_request(metric, category, contract)
    return chart_payload(metric, category, contract)
