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
- `GET /data/mock/{metric}/{category}/{contract}.json`
- `GET /docs` (Swagger UI)

Chart mock payloads are generated dynamically per request; no local mock data folder is required.
