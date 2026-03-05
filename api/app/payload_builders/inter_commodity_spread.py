"""Inter-commodity spread payload construction."""

from __future__ import annotations

from fastapi import HTTPException

from ..futures_repository import contract_close_by_date


def inter_commodity_spread_payload(
    left_category: str,
    left_contract: str,
    right_category: str,
    right_contract: str,
) -> dict[str, object]:
    """Build rolling spread payload for one inter-commodity contract pair."""
    if left_category == right_category and left_contract == right_contract:
        raise HTTPException(status_code=404, detail='Spread legs must be different')

    left_closes = contract_close_by_date(left_category, left_contract)
    right_closes = contract_close_by_date(right_category, right_contract)
    common_dates = sorted(set(left_closes).intersection(right_closes))
    if not common_dates:
        raise HTTPException(status_code=404, detail='No overlapping spread rows for request')

    items: list[dict[str, object]] = []
    for trading_date in common_dates:
        left_close = left_closes[trading_date]
        right_close = right_closes[trading_date]
        spread = round(left_close - right_close, 4)
        items.append(
            {
                'date': trading_date.isoformat(),
                'left': left_close,
                'right': right_close,
                'spread': spread,
            }
        )

    return {
        'axes': {'left': {'label': '价差(元)', 'labelKey': 'chart.axes.right.spread'}},
        'series': [
            {
                'key': 'spread',
                'label': '价差',
                'labelKey': 'chart.interCommoditySpread.series.spread',
                'type': 'line',
                'yAxisId': 'left',
                'color': '#c14a3f',
                'strokeWidth': 2,
            }
        ],
        'items': items,
        'meta': {
            'leftCategory': left_category,
            'leftContract': left_contract,
            'rightCategory': right_category,
            'rightContract': right_contract,
            'formula': f'{left_category}{left_contract}-{right_category}{right_contract}',
        },
    }
