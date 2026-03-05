"""FastAPI entrypoint for the dashboard backend."""

from __future__ import annotations

from datetime import date

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .catalog import validate_request
from .catalog import valid_categories
from .futures_repository import contract_month_value
from .payloads import cached_calendar_spread_payload
from .payloads import cached_inter_commodity_spread_payload
from .payloads import cached_monthly_change_payload
from .payloads import cached_term_structure_payload
from .payloads import chart_payload

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
