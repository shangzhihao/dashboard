"""Term-structure payload construction."""

from __future__ import annotations

from datetime import date
from datetime import timedelta

from fastapi import HTTPException

from ..constants import SERIES_COLORS
from ..constants import TERM_STRUCTURE_LOOKBACKS
from ..futures_repository import add_months
from ..futures_repository import item_price_rows
from ..futures_repository import nearest_available_date
from ..futures_repository import resolve_front_contract
from ..futures_repository import rows_by_date


def term_structure_payload(category: str, query_date: date) -> dict[str, object]:
    """Build term-structure chart payload using one query date anchor."""
    rows = item_price_rows(category)
    grouped = rows_by_date(rows)
    available_dates = sorted(grouped)
    if not available_dates:
        raise HTTPException(status_code=404, detail='No data for term structure')

    matched = nearest_available_date(available_dates, query_date)
    if matched is None:
        raise HTTPException(status_code=404, detail='No term structure data on or before date')
    anchor_date = matched

    items: list[dict[str, object]] = [
        {'date': 'near'},
        *({'date': f'n{offset}'} for offset in range(1, 12)),
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

        value_map = {(entry['year'], entry['month']): entry['close'] for entry in date_rows}
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
                'key': series_key,
                'label': label,
                'labelKey': label_key,
                'type': 'line',
                'yAxisId': 'left',
                'color': SERIES_COLORS[index % len(SERIES_COLORS)],
                'strokeWidth': 2,
            }
        )

    if not series:
        raise HTTPException(status_code=404, detail='No term structure curves for request')

    return {
        'axes': {'left': {'label': '价格', 'labelKey': 'chart.axes.left.price'}},
        'series': series,
        'items': items,
        'meta': {'date': anchor_date.isoformat()},
    }
