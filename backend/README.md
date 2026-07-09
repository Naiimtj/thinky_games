# Thinky Games backend

FastAPI service that stores puzzle completion times and serves leaderboards.
Uses MySQL with Alembic migrations (run automatically on startup).

## Requirements

- Python 3.11–3.13
- [uv](https://docs.astral.sh/uv/)
- MySQL 8 (`just db-up` starts a local container)

## Common tasks (from the repository root)

```bash
just install-backend   # uv sync
just run-backend       # uvicorn with reload
just test              # pytest
just test-cov          # pytest with coverage
```
