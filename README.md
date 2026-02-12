# Futures Dashboard Monorepo

## Requirements

For local development:

- Node.js 20+ and `npm`
- Python 3.11+
- `uv`

For Docker launch:

- Docker Engine 24+ (or Docker Desktop)
- Docker Compose v2 (`docker compose`)

## Layout

- `web/`: Next.js + TypeScript frontend dashboard
- `api/`: FastAPI backend service
- `nginx/`: reverse proxy config for containerized launch
- `scripts/`: local/dev and non-Docker launch scripts

## Frontend (web)

```bash
cd web
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`.

Other commands:

- `npm run build`
- `npm run start`
- `npm run test`
- `npm run lint`

## Backend (api)

```bash
cd api
uv sync
uv run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Open API docs at `http://127.0.0.1:8000/docs`.

## Launch Both (Local Dev)

```bash
./scripts/launch.sh
```

This script starts:

- FastAPI at `http://127.0.0.1:8000`
- Next.js at `http://127.0.0.1:3000`

If either port is already in use, the script automatically picks the next available port.

## Docker Launch

Build and run all services (FastAPI + Next.js + NGINX):

```bash
docker compose up --build
```

Run in detached mode:

```bash
docker compose up -d --build
```

Open:

- App: `http://127.0.0.1:8888`
- API docs: `http://127.0.0.1:8888/api/docs`

Stop containers:

```bash
docker compose down
```

Optional overrides:

```bash
NGINX_PORT=8080 API_WORKERS=4 docker compose up -d --build
```

## Deploy Without Docker

```bash
./scripts/deploy.sh
```

Default ports:

- App at `http://127.0.0.1:8888`
- FastAPI at `http://127.0.0.1:8000` (proxied by Next.js under `/api`)
