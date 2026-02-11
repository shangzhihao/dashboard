FROM ghcr.io/astral-sh/uv:python3.11-bookworm

ENV UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/workspace/api/.venv/bin:$PATH"

WORKDIR /workspace/api

COPY api/pyproject.toml api/uv.lock api/README.md ./
COPY api/app ./app

RUN uv sync --frozen --no-dev

COPY data /workspace/data
COPY web/public/data /workspace/web/public/data

EXPOSE 8000

CMD ["sh", "-c", "/workspace/api/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${API_WORKERS:-2}"]
