#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/web"
API_DIR="$ROOT_DIR/api"

API_HOST="${API_HOST:-127.0.0.1}"
API_PORT="${API_PORT:-8000}"
API_WORKERS="${API_WORKERS:-2}"
WEB_HOST="${WEB_HOST:-0.0.0.0}"
WEB_PORT="${WEB_PORT:-8888}"
BUILD_ON_START="${BUILD_ON_START:-1}"
BACKEND_ORIGIN="${BACKEND_ORIGIN:-http://${API_HOST}:${API_PORT}}"

API_PID=""
WEB_PID=""

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: required command not found: $cmd"
    exit 1
  fi
}

port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "( sport = :$port )" | grep -q ":$port"
    return $?
  fi
  return 1
}

require_port_free() {
  local port="$1"
  local name="$2"
  if port_in_use "$port"; then
    echo "Error: ${name} port ${port} is already in use."
    exit 1
  fi
}

cleanup() {
  if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
  if [[ -n "$API_PID" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
}

wait_for_shutdown() {
  while true; do
    if [[ -n "$API_PID" ]] && ! kill -0 "$API_PID" 2>/dev/null; then
      wait "$API_PID" || true
      return 1
    fi
    if [[ -n "$WEB_PID" ]] && ! kill -0 "$WEB_PID" 2>/dev/null; then
      wait "$WEB_PID" || true
      return 1
    fi
    sleep 1
  done
}

trap cleanup EXIT INT TERM

require_cmd uv
require_cmd pnpm

require_port_free "$API_PORT" "API"
require_port_free "$WEB_PORT" "Web"

if [[ "$BUILD_ON_START" == "1" ]]; then
  echo "Installing backend dependencies..."
  (
    cd "$API_DIR"
    uv sync --frozen --no-dev
  )

  echo "Installing frontend dependencies..."
  (
    cd "$WEB_DIR"
    pnpm install --frozen-lockfile
  )

  echo "Building frontend..."
  (
    cd "$WEB_DIR"
    NEXT_PUBLIC_API_BASE_URL="/api" BACKEND_ORIGIN="$BACKEND_ORIGIN" pnpm run build
  )
fi

echo "Starting FastAPI on http://${API_HOST}:${API_PORT} ..."
(
  cd "$API_DIR"
  env -u VIRTUAL_ENV uv run --no-dev uvicorn app.main:app --host "$API_HOST" --port "$API_PORT" --workers "$API_WORKERS"
) &
API_PID="$!"

echo "Starting Next.js on http://${WEB_HOST}:${WEB_PORT} ..."
(
  cd "$WEB_DIR"
  NEXT_PUBLIC_API_BASE_URL="/api" BACKEND_ORIGIN="$BACKEND_ORIGIN" pnpm exec next start --hostname "$WEB_HOST" --port "$WEB_PORT"
) &
WEB_PID="$!"

wait_for_shutdown
