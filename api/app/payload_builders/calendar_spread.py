"""Calendar-spread payload construction."""

from __future__ import annotations

from fastapi import HTTPException

from ..futures_repository import contract_month_value
from ..futures_repository import item_price_rows
from ..futures_repository import rows_by_date
from ..futures_repository import spread_contract_year


def calendar_spread_payload(
    category: str,
    near_contract: str,
    far_contract: str,
) -> dict[str, object]:
    """Build rolling calendar spread payload for one category + contract pair."""
    near_month = contract_month_value(near_contract)
    far_month = contract_month_value(far_contract)
    if near_contract == far_contract:
        raise HTTPException(status_code=404, detail='Contracts must be different')

    rows = item_price_rows(category)
    grouped = rows_by_date(rows)
    available_dates = sorted(grouped)
    if not available_dates:
        raise HTTPException(status_code=404, detail='No spread data')

    items: list[dict[str, object]] = []
    for trading_date in available_dates:
        day_rows = grouped.get(trading_date, [])
        if not day_rows:
            continue

        value_map = {(entry['year'], entry['month']): entry['close'] for entry in day_rows}
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
                'date': trading_date.isoformat(),
                'near': near_price,
                'spread': spread,
            }
        )

    if not items:
        raise HTTPException(status_code=404, detail='No spread rows for request')

    return {
        'axes': {
            'left': {'label': '价格', 'labelKey': 'chart.axes.left.price'},
            'right': {'label': '价差(元)', 'labelKey': 'chart.axes.right.spread'},
        },
        'series': [
            {
                'key': 'near',
                'label': f'{near_contract}合约收盘价',
                'labelKey': 'chart.calendarSpread.series.near',
                'type': 'line',
                'yAxisId': 'left',
                'color': '#e84c4a',
                'strokeWidth': 2,
            },
            {
                'key': 'spread',
                'label': '价差',
                'labelKey': 'chart.calendarSpread.series.spread',
                'type': 'line',
                'yAxisId': 'right',
                'color': '#34495e',
                'strokeWidth': 2,
            },
        ],
        'items': items,
        'meta': {
            'nearContract': near_contract,
            'farContract': far_contract,
            'formula': f'{near_contract}-{far_contract}',
        },
    }
