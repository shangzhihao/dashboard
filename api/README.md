# Dashboard API (FastAPI)

## Requirements

- `uv` installed
- Python 3.11+

## Run locally

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /health`
- `GET /data/futures/{metric}/{category}/{contract}.json`
- `GET /data/futures/term-structure/{category}/{YYYY}/{MM}/{DD}.json`
- `GET /data/futures/monthly-change/{category}/{contract}.json`
- `GET /docs` (Swagger UI)

Chart payloads are generated dynamically from `data/futures.parquet`.
