"""FastAPI entrypoint for the dashboard backend."""

from __future__ import annotations

from datetime import date
from datetime import timedelta
from functools import lru_cache
import hashlib
import json
import math
from pathlib import Path

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

SERIES_COLORS: tuple[str, ...] = (
    "#c63e34",
    "#253045",
    "#5fa5ae",
    "#e18a69",
    "#7dba98",
    "#bcc0ce",
    "#a3a9bc",
    "#c2c5d0",
)
SERIES_COUNT = 8
DAYS_COUNT = 160
START_DATE = date(2024, 1, 2)

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


def stable_number(token: str, minimum: int, maximum: int) -> int:
    """Create a deterministic integer in [minimum, maximum]."""
    digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
    value = int(digest[:8], 16)
    span = (maximum - minimum) + 1
    return minimum + (value % span)


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
        mapping[metric_key] = {entry for entry in contract_keys if isinstance(entry, str)}
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


def category_symbol(category: str) -> str:
    """Create a short symbol from category key."""
    tail = category.split("-")[-1]
    letters = "".join(ch for ch in tail if ch.isalpha()).upper()
    if len(letters) >= 2:
        return letters[:2]
    return (letters + "X")[:2]


def series_contract_suffix(contract: str, index: int) -> str:
    """Build year-contract suffix used in series labels."""
    year = 26 - index
    if contract == "index":
        return f"idx{year}"
    month = contract[1:] if contract.startswith("c") and len(contract) == 3 else "00"
    return f"{year}{month}"


def build_series(metric: str, category: str, contract: str) -> list[dict[str, object]]:
    """Build chart series definitions."""
    symbol = category_symbol(category)
    series: list[dict[str, object]] = []
    for index in range(SERIES_COUNT):
        suffix = series_contract_suffix(contract, index)
        key = f"{symbol.lower()}{suffix}"
        series.append(
            {
                "key": key,
                "label": f"{symbol}{suffix.upper()}",
                "labelKey": None,
                "type": "line",
                "yAxisId": "left",
                "color": SERIES_COLORS[index % len(SERIES_COLORS)],
                "strokeWidth": 2,
            }
        )
    return series


def metric_shift(metric: str) -> int:
    """Return baseline value shift by metric."""
    return 2500 if metric == "price" else 1200


def point_value(
    metric: str,
    category: str,
    contract: str,
    day_index: int,
    series_index: int,
) -> int:
    """Generate one deterministic value for a chart point."""
    seed = stable_number(f"{metric}:{category}:{contract}:{series_index}", 0, 10_000)
    base = stable_number(f"base:{metric}:{category}:{series_index}", 900, 9000)
    amplitude = 120 + (seed % 220)
    trend = (seed % 9) - 4
    seasonal = int(math.sin((day_index + (series_index * 3)) / 8.0) * amplitude)
    drift = day_index * trend
    noise = ((day_index + series_index) % 7) * (series_index + 2) * 2
    value = base + seasonal + drift + noise + metric_shift(metric)
    return max(80, value)


def build_items(
    metric: str,
    category: str,
    contract: str,
    series: list[dict[str, object]],
) -> list[dict[str, object]]:
    """Build chart item rows for requested inputs."""
    items: list[dict[str, object]] = []
    for day_index in range(DAYS_COUNT):
        row_date = START_DATE + timedelta(days=day_index)
        row: dict[str, object] = {"date": row_date.isoformat()}
        for series_index, entry in enumerate(series):
            key = entry["key"]
            if isinstance(key, str):
                row[key] = point_value(metric, category, contract, day_index, series_index)
        items.append(row)
    return items


@lru_cache(maxsize=4096)
def chart_payload(metric: str, category: str, contract: str) -> dict[str, object]:
    """Generate and cache chart payload for one request tuple."""
    series = build_series(metric, category, contract)
    axis_label = "价格" if metric == "price" else "持仓(手)"
    axis_label_key = "chart.axes.left.price" if metric == "price" else "chart.axes.left.positions"
    return {
        "axes": {"left": {"label": axis_label, "labelKey": axis_label_key}},
        "series": series,
        "items": build_items(metric, category, contract, series),
    }


@app.get("/health")
async def health() -> dict[str, str]:
    """Health check endpoint used by local/dev environments."""
    return {"status": "ok"}


@app.get("/data/mock/{metric}/{category}/{contract}.json")
async def chart_mock_data(metric: str, category: str, contract: str) -> dict[str, object]:
    """Generate and return chart mock payload by route params."""
    validate_request(metric, category, contract)
    return chart_payload(metric, category, contract)
