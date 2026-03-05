"""Chart/table payload builders for API routes."""

from __future__ import annotations

from calendar import monthrange
from datetime import date
from datetime import timedelta
from functools import lru_cache

from fastapi import HTTPException

from .constants import SERIES_COLORS
from .constants import TERM_STRUCTURE_LOOKBACKS
from .futures_repository import add_months
from .futures_repository import contract_close_by_date
from .futures_repository import contract_month_value
from .futures_repository import item_price_rows
from .futures_repository import matching_rows
from .futures_repository import month_day_key
from .futures_repository import month_day_sort_key
from .futures_repository import nearest_available_date
from .futures_repository import resolve_front_contract
from .futures_repository import rows_by_date
from .futures_repository import spread_contract_year


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
