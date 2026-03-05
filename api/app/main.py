"""FastAPI entrypoint for the dashboard backend."""

from __future__ import annotations

from bisect import bisect_right
from calendar import monthrange
from datetime import date
from datetime import datetime
from datetime import timedelta
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

TERM_STRUCTURE_LOOKBACKS: tuple[tuple[str, str, str, int], ...] = (
    ("t0", "Today", "chart.termStructure.series.today", 0),
    ("t1w", "1W Ago", "chart.termStructure.series.weekAgo", 7),
    ("t1m", "1M Ago", "chart.termStructure.series.monthAgo", 30),
    ("t3m", "3M Ago", "chart.termStructure.series.threeMonthsAgo", 90),
    ("t6m", "6M Ago", "chart.termStructure.series.sixMonthsAgo", 180),
    ("t1y", "1Y Ago", "chart.termStructure.series.yearAgo", 365),
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


def float_or_none(value: Any) -> float | None:
    """Convert unknown value to float."""
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    if not (parsed == parsed):  # NaN
        return None
    return parsed


def item_price_rows(item: str) -> list[dict[str, Any]]:
    """Return normalized close-price rows for one item across all contracts."""
    table = futures_table()
    filtered = table.filter(pc.equal(table["item"], item))
    if filtered.num_rows == 0:
        raise HTTPException(status_code=404, detail="No data for category")

    rows: list[dict[str, Any]] = []
    for year_raw, month_raw, eob_raw, close_raw in zip(
        filtered["year"].to_pylist(),
        filtered["month"].to_pylist(),
        filtered["eob"].to_pylist(),
        filtered["close"].to_pylist(),
    ):
        if year_raw is None or month_raw is None:
            continue
        try:
            contract_year = int(str(year_raw))
            contract_month = int(str(month_raw))
        except ValueError:
            continue
        if contract_month < 1 or contract_month > 12:
            continue
        trading_day = parse_eob_date(eob_raw)
        close_value = float_or_none(close_raw)
        if trading_day is None or close_value is None:
            continue
        rows.append(
            {
                "year": contract_year,
                "month": contract_month,
                "eob": trading_day,
                "close": close_value,
            }
        )

    if not rows:
        raise HTTPException(status_code=404, detail="No valid rows after normalization")
    return rows


def rows_by_date(rows: list[dict[str, Any]]) -> dict[date, list[dict[str, Any]]]:
    """Group normalized rows by trading date."""
    grouped: dict[date, list[dict[str, Any]]] = {}
    for row in rows:
        grouped.setdefault(row["eob"], []).append(row)
    return grouped


def nearest_available_date(sorted_dates: list[date], target: date) -> date | None:
    """Find nearest available trading date <= target."""
    index = bisect_right(sorted_dates, target) - 1
    if index < 0:
        return None
    return sorted_dates[index]


def add_months(year: int, month: int, delta: int) -> tuple[int, int]:
    """Shift one year-month tuple by delta months."""
    zero_based = (year * 12 + (month - 1)) + delta
    next_year = zero_based // 12
    next_month = zero_based % 12 + 1
    return next_year, next_month


def spread_contract_year(reference_date: date, near_month: int) -> int:
    """Resolve spread near-leg contract year for one trading date."""
    if reference_date.month <= near_month:
        return reference_date.year
    return reference_date.year + 1


def resolve_front_contract(
    contracts: list[tuple[int, int]],
    reference_date: date,
) -> tuple[int, int]:
    """Resolve the front contract (near) for one reference date."""
    if not contracts:
        raise HTTPException(status_code=404, detail="No contracts on reference date")
    current_month = (reference_date.year, reference_date.month)
    for contract in contracts:
        if contract >= current_month:
            return contract
    return contracts[0]


def term_structure_payload(category: str, query_date: date) -> dict[str, object]:
    """Build term-structure chart payload using one query date anchor."""
    rows = item_price_rows(category)
    grouped = rows_by_date(rows)
    available_dates = sorted(grouped)
    if not available_dates:
        raise HTTPException(status_code=404, detail="No data for term structure")

    matched = nearest_available_date(available_dates, query_date)
    if matched is None:
        raise HTTPException(status_code=404, detail="No term structure data on or before date")
    anchor_date = matched

    items: list[dict[str, object]] = [
        {"date": "near"},
        *({"date": f"n{offset}"} for offset in range(1, 12)),
    ]
    series: list[dict[str, object]] = []

    for index, (series_key, label, label_key, lookback_days) in enumerate(TERM_STRUCTURE_LOOKBACKS):
        target_date = anchor_date - timedelta(days=lookback_days)
        reference_date = nearest_available_date(available_dates, target_date)
        if reference_date is None:
            continue

        date_rows = grouped.get(reference_date, [])
        if not date_rows:
            continue

        value_map = {
            (entry["year"], entry["month"]): entry["close"]
            for entry in date_rows
        }
        sorted_contracts = sorted(value_map)
        near_year, near_month = resolve_front_contract(sorted_contracts, reference_date)

        has_value = False
        for offset, row in enumerate(items):
            target_year, target_month = add_months(near_year, near_month, offset)
            value = value_map.get((target_year, target_month))
            if value is None:
                continue
            row[series_key] = round(float(value), 4)
            has_value = True

        if not has_value:
            continue

        series.append(
            {
                "key": series_key,
                "label": label,
                "labelKey": label_key,
                "type": "line",
                "yAxisId": "left",
                "color": SERIES_COLORS[index % len(SERIES_COLORS)],
                "strokeWidth": 2,
            }
        )

    if not series:
        raise HTTPException(status_code=404, detail="No term structure curves for request")

    return {
        "axes": {"left": {"label": "价格", "labelKey": "chart.axes.left.price"}},
        "series": series,
        "items": items,
        "meta": {"date": anchor_date.isoformat()},
    }


def calendar_spread_payload(
    category: str,
    near_contract: str,
    far_contract: str,
) -> dict[str, object]:
    """Build rolling calendar spread payload for one category + contract pair."""
    near_month = contract_month_value(near_contract)
    far_month = contract_month_value(far_contract)
    if near_contract == far_contract:
        raise HTTPException(status_code=404, detail="Contracts must be different")

    rows = item_price_rows(category)
    grouped = rows_by_date(rows)
    available_dates = sorted(grouped)
    if not available_dates:
        raise HTTPException(status_code=404, detail="No spread data")

    items: list[dict[str, object]] = []
    for trading_date in available_dates:
        day_rows = grouped.get(trading_date, [])
        if not day_rows:
            continue

        value_map = {(entry["year"], entry["month"]): entry["close"] for entry in day_rows}
        near_year = spread_contract_year(trading_date, near_month)
        far_year = near_year if far_month >= near_month else near_year + 1
        near_value = value_map.get((near_year, near_month))
        far_value = value_map.get((far_year, far_month))
        if near_value is None or far_value is None:
            continue

        near_price = round(float(near_value), 4)
        spread = round(float(near_value) - float(far_value), 4)
        items.append(
            {
                "date": trading_date.isoformat(),
                "near": near_price,
                "spread": spread,
            }
        )

    if not items:
        raise HTTPException(status_code=404, detail="No spread rows for request")

    return {
        "axes": {
            "left": {"label": "价格", "labelKey": "chart.axes.left.price"},
            "right": {"label": "价差(元)", "labelKey": "chart.axes.right.spread"},
        },
        "series": [
            {
                "key": "near",
                "label": f"{near_contract}合约收盘价",
                "labelKey": "chart.calendarSpread.series.near",
                "type": "line",
                "yAxisId": "left",
                "color": "#e84c4a",
                "strokeWidth": 2,
            },
            {
                "key": "spread",
                "label": "价差",
                "labelKey": "chart.calendarSpread.series.spread",
                "type": "line",
                "yAxisId": "right",
                "color": "#34495e",
                "strokeWidth": 2,
            },
        ],
        "items": items,
        "meta": {
            "nearContract": near_contract,
            "farContract": far_contract,
            "formula": f"{near_contract}-{far_contract}",
        },
    }


def contract_close_by_date(category: str, contract: str) -> dict[date, float]:
    """Resolve one contract-month close series keyed by trading date."""
    contract_month = contract_month_value(contract)
    rows = item_price_rows(category)
    grouped = rows_by_date(rows)

    closes: dict[date, float] = {}
    for trading_date in sorted(grouped):
        day_rows = grouped.get(trading_date, [])
        if not day_rows:
            continue
        value_map = {(entry["year"], entry["month"]): entry["close"] for entry in day_rows}
        contract_year = spread_contract_year(trading_date, contract_month)
        value = value_map.get((contract_year, contract_month))
        if value is None:
            continue
        closes[trading_date] = round(float(value), 4)

    if not closes:
        raise HTTPException(status_code=404, detail="No rows for category/contract")
    return closes


def inter_commodity_spread_payload(
    left_category: str,
    left_contract: str,
    right_category: str,
    right_contract: str,
) -> dict[str, object]:
    """Build rolling spread payload for one inter-commodity contract pair."""
    if left_category == right_category and left_contract == right_contract:
        raise HTTPException(status_code=404, detail="Spread legs must be different")

    left_closes = contract_close_by_date(left_category, left_contract)
    right_closes = contract_close_by_date(right_category, right_contract)
    common_dates = sorted(set(left_closes).intersection(right_closes))
    if not common_dates:
        raise HTTPException(status_code=404, detail="No overlapping spread rows for request")

    items: list[dict[str, object]] = []
    for trading_date in common_dates:
        left_close = left_closes[trading_date]
        right_close = right_closes[trading_date]
        spread = round(left_close - right_close, 4)
        items.append(
            {
                "date": trading_date.isoformat(),
                "left": left_close,
                "right": right_close,
                "spread": spread,
            }
        )

    return {
        "axes": {"left": {"label": "价差(元)", "labelKey": "chart.axes.right.spread"}},
        "series": [
            {
                "key": "spread",
                "label": "价差",
                "labelKey": "chart.interCommoditySpread.series.spread",
                "type": "line",
                "yAxisId": "left",
                "color": "#c14a3f",
                "strokeWidth": 2,
            }
        ],
        "items": items,
        "meta": {
            "leftCategory": left_category,
            "leftContract": left_contract,
            "rightCategory": right_category,
            "rightContract": right_contract,
            "formula": f"{left_category}{left_contract}-{right_category}{right_contract}",
        },
    }


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


@lru_cache(maxsize=8192)
def cached_term_structure_payload(category: str, query_date: date) -> dict[str, object]:
    """Generate and cache term structure payload."""
    return term_structure_payload(category, query_date)


@lru_cache(maxsize=8192)
def cached_calendar_spread_payload(
    category: str,
    near_contract: str,
    far_contract: str,
) -> dict[str, object]:
    """Generate and cache calendar spread payload."""
    return calendar_spread_payload(category, near_contract, far_contract)


@lru_cache(maxsize=8192)
def cached_inter_commodity_spread_payload(
    left_category: str,
    left_contract: str,
    right_category: str,
    right_contract: str,
) -> dict[str, object]:
    """Generate and cache inter-commodity spread payload."""
    return inter_commodity_spread_payload(
        left_category,
        left_contract,
        right_category,
        right_contract,
    )


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


@app.get("/data/futures/term-structure/{category}/{year}/{month}/{day}.json")
async def futures_term_structure(
    category: str,
    year: int,
    month: int,
    day: int,
) -> dict[str, object]:
    """Return term-structure chart payload by category and query date."""
    if category not in valid_categories():
        raise HTTPException(status_code=404, detail="Unknown category")
    try:
        query_date = date(year, month, day)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Invalid date") from exc
    return cached_term_structure_payload(category, query_date)


@app.get("/data/futures/calendar-spread/{category}/{near_contract}/{far_contract}.json")
async def futures_calendar_spread(
    category: str,
    near_contract: str,
    far_contract: str,
) -> dict[str, object]:
    """Return rolling calendar spread chart payload by category and contract pair."""
    if category not in valid_categories():
        raise HTTPException(status_code=404, detail="Unknown category")
    contract_month_value(near_contract)
    contract_month_value(far_contract)
    return cached_calendar_spread_payload(category, near_contract, far_contract)


@app.get(
    "/data/futures/inter-commodity-spread/"
    "{left_category}/{left_contract}/{right_category}/{right_contract}.json"
)
async def futures_inter_commodity_spread(
    left_category: str,
    left_contract: str,
    right_category: str,
    right_contract: str,
) -> dict[str, object]:
    """Return rolling inter-commodity spread chart payload by two legs."""
    if left_category not in valid_categories() or right_category not in valid_categories():
        raise HTTPException(status_code=404, detail="Unknown category")
    contract_month_value(left_contract)
    contract_month_value(right_contract)
    return cached_inter_commodity_spread_payload(
        left_category,
        left_contract,
        right_category,
        right_contract,
    )


@app.get("/data/futures/{metric}/{category}/{contract}.json")
async def chart_futures_data(metric: str, category: str, contract: str) -> dict[str, object]:
    """Return chart payload by route params from futures parquet."""
    validate_request(metric, category, contract)
    return chart_payload(metric, category, contract)
