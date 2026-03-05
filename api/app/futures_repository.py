"""Data loading and normalization for futures parquet datasets."""

from __future__ import annotations

from bisect import bisect_right
from datetime import date
from datetime import datetime
from functools import lru_cache
from pathlib import Path
from typing import Any

from fastapi import HTTPException
import pyarrow.compute as pc
import pyarrow.parquet as pq


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
