#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/web"
API_DIR="$ROOT_DIR/api"
API_HOST="${API_HOST:-127.0.0.1}"
API_PORT="${API_PORT:-8000}"
WEB_HOST="${WEB_HOST:-127.0.0.1}"
WEB_PORT="${WEB_PORT:-3000}"
API_BASE_URL="http://${API_HOST}:${API_PORT}"

API_PID=""
WEB_PID=""

port_in_use() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi
  return 1
}

health_endpoint_ok() {
  local base_url="$1"
  curl -fsS "${base_url}/health" >/dev/null 2>&1
}

find_free_port() {
  local port="$1"
  local max_tries=50
  local tries=0
  while [[ "$tries" -lt "$max_tries" ]]; do
    if ! port_in_use "$port"; then
      echo "$port"
      return 0
    fi
    port=$((port + 1))
    tries=$((tries + 1))
  done
  return 1
}

cleanup() {
  if [[ -n "$API_PID" ]] && kill -0 "$API_PID" 2>/dev/null; then
    kill "$API_PID" 2>/dev/null || true
  fi
  if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
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

if port_in_use "$API_PORT"; then
  if health_endpoint_ok "$API_BASE_URL"; then
    echo "Port ${API_PORT} is in use; reusing backend at ${API_BASE_URL}."
  else
    NEXT_API_PORT="$(find_free_port "$((API_PORT + 1))")"
    if [[ -z "$NEXT_API_PORT" ]]; then
      echo "Error: could not find free port for backend."
      exit 1
    fi
    API_PORT="$NEXT_API_PORT"
    API_BASE_URL="http://${API_HOST}:${API_PORT}"
    echo "Port 8000 is in use by another service; starting backend on ${API_BASE_URL} ..."
    (
      cd "$API_DIR" &&
        env -u VIRTUAL_ENV uv run uvicorn app.main:app --reload --host "$API_HOST" --port "$API_PORT"
    ) &
    API_PID="$!"
  fi
else
  echo "Starting FastAPI on ${API_BASE_URL} ..."
  (
    cd "$API_DIR" &&
      env -u VIRTUAL_ENV uv run uvicorn app.main:app --reload --host "$API_HOST" --port "$API_PORT"
  ) &
  API_PID="$!"
fi

if port_in_use "$WEB_PORT"; then
  NEXT_WEB_PORT="$(find_free_port "$((WEB_PORT + 1))")"
  if [[ -z "$NEXT_WEB_PORT" ]]; then
    echo "Error: could not find free port for frontend."
    exit 1
  fi
  WEB_PORT="$NEXT_WEB_PORT"
  echo "Port 3000 is in use; starting frontend on http://${WEB_HOST}:${WEB_PORT} ..."
  (
    cd "$WEB_DIR" &&
      NEXT_PUBLIC_API_BASE_URL="$API_BASE_URL" pnpm exec next dev --hostname "$WEB_HOST" --port "$WEB_PORT"
  ) &
  WEB_PID="$!"
else
  echo "Starting Next.js on http://${WEB_HOST}:${WEB_PORT} ..."
  (
    cd "$WEB_DIR" &&
      NEXT_PUBLIC_API_BASE_URL="$API_BASE_URL" pnpm exec next dev --hostname "$WEB_HOST" --port "$WEB_PORT"
  ) &
  WEB_PID="$!"
fi

if [[ -z "$API_PID" && -z "$WEB_PID" ]]; then
  echo "Both services already running; nothing new to launch."
  exit 0
fi

wait_for_shutdown
