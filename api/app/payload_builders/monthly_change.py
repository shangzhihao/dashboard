"""Monthly change table payload construction."""

from __future__ import annotations

from calendar import monthrange
from datetime import date

from fastapi import HTTPException

from ..futures_repository import contract_month_value
from ..futures_repository import matching_rows


def monthly_change_payload(category: str, contract: str) -> dict[str, object]:
    """Build monthly percentage change table for one category + contract."""
    contract_month = contract_month_value(contract)
    rows = matching_rows('price', category, contract)
    available_years = sorted({entry['series_year'] for entry in rows})
    items: list[dict[str, object]] = []

    for series_year in available_years:
        start_date = date(series_year - 1, contract_month, 1)
        end_date = date(series_year, contract_month, monthrange(series_year, contract_month)[1])
        window_rows = sorted(
            [
                entry
                for entry in rows
                if entry['series_year'] == series_year and start_date <= entry['eob'] <= end_date
            ],
            key=lambda entry: entry['eob'],
        )
        if not window_rows:
            continue

        month_first_year_month: dict[int, tuple[int, int]] = {}
        month_ohlc: dict[tuple[int, int], dict[str, float]] = {}
        for entry in window_rows:
            eob_day = entry['eob']
            value = float(entry['value'])
            year_month = (eob_day.year, eob_day.month)
            if eob_day.month not in month_first_year_month:
                month_first_year_month[eob_day.month] = year_month
            bucket = month_ohlc.setdefault(year_month, {'open': value, 'close': value})
            bucket['close'] = value

        row: dict[str, object] = {'year': str(series_year % 100)}
        for month in range(1, 13):
            key = f'm{month:02d}'
            year_month = month_first_year_month.get(month)
            if year_month is None:
                row[key] = None
                continue
            bucket = month_ohlc.get(year_month)
            if not bucket or bucket['open'] == 0:
                row[key] = None
                continue
            row[key] = round((bucket['close'] - bucket['open']) / bucket['open'] * 100, 2)
        items.append(row)

    if not items:
        raise HTTPException(status_code=404, detail='No monthly change rows for request')

    return {'items': items}
