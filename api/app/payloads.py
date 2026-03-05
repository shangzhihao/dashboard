"""Cached payload facade for API routes."""

from __future__ import annotations

from datetime import date
from functools import lru_cache

from .payload_builders import calendar_spread_payload
from .payload_builders import inter_commodity_spread_payload
from .payload_builders import monthly_change_payload
from .payload_builders import seasonal_chart_payload
from .payload_builders import term_structure_payload


@lru_cache(maxsize=4096)
def chart_payload(metric: str, category: str, contract: str) -> dict[str, object]:
    """Generate and cache chart payload for one request tuple."""
    return seasonal_chart_payload(metric, category, contract)


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
