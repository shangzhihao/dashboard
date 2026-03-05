"""Seasonal chart payload construction."""

from __future__ import annotations

from calendar import monthrange
from datetime import date

from fastapi import HTTPException

from ..constants import SERIES_COLORS
from ..futures_repository import contract_month_value
from ..futures_repository import matching_rows
from ..futures_repository import month_day_key
from ..futures_repository import month_day_sort_key


def seasonal_chart_payload(metric: str, category: str, contract: str) -> dict[str, object]:
    """Build chart payload using futures parquet rows."""
    contract_month = contract_month_value(contract)
    rows = matching_rows(metric, category, contract)
    available_years = sorted({entry['series_year'] for entry in rows}, reverse=True)

    by_date: dict[str, dict[str, object]] = {}
    series: list[dict[str, object]] = []
    series_index = 0

    for series_year in available_years:
        start_date = date(series_year - 1, contract_month, 1)
        end_date = date(series_year, contract_month, monthrange(series_year, contract_month)[1])

        window_rows = [
            entry
            for entry in rows
            if entry['series_year'] == series_year and start_date <= entry['eob'] <= end_date
        ]
        if not window_rows:
            continue

        series_key = f'y{series_year}{contract}'
        series.append(
            {
                'key': series_key,
                'label': f'{series_year}-{contract}',
                'type': 'line',
                'yAxisId': 'left',
                'color': SERIES_COLORS[series_index % len(SERIES_COLORS)],
                'strokeWidth': 2,
            }
        )
        series_index += 1

        for entry in window_rows:
            day_key = month_day_key(entry['eob'])
            row = by_date.setdefault(day_key, {'date': day_key})
            # Keep the first value for duplicated MM-DD in the same contract-year window.
            if series_key not in row:
                row[series_key] = entry['value']

    if not series:
        raise HTTPException(status_code=404, detail='No seasonal series for request')

    start_day = f'{contract}-01'
    by_date.setdefault(start_day, {'date': start_day})

    items = [
        by_date[day]
        for day in sorted(
            by_date,
            key=lambda day: month_day_sort_key(day, contract_month),
        )
    ]
    axis_label = '价格' if metric == 'price' else '持仓(手)'
    axis_label_key = 'chart.axes.left.price' if metric == 'price' else 'chart.axes.left.positions'

    return {
        'axes': {'left': {'label': axis_label, 'labelKey': axis_label_key}},
        'series': series,
        'items': items,
    }
