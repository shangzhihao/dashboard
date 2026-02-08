# Futures Dashboard Monorepo

## Layout

- `web/`: Next.js + TypeScript frontend dashboard
- `api/`: FastAPI backend service

## Frontend (web)

```bash
cd web
npm run dev
```

Open `http://localhost:3000`.

Other commands:

- `npm run build`
- `npm run start`
- `npm run test`
- `npm run lint`

## Backend (api)

```bash
cd api
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

Open API docs at `http://localhost:8000/docs`.

## Launch Both

```bash
./scripts/launch.sh
```

This script starts:

- FastAPI at `http://127.0.0.1:8000`
- Next.js at `http://127.0.0.1:3000`
