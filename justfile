# Thinky Games — task runner.
# Run `just` (no args) to list all recipes.

set shell := ["bash", "-cu"]

_default:
    @just --list

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

# Install backend and frontend dependencies.
install: install-backend install-frontend

# Sync backend dependencies (creates .venv and uv.lock).
install-backend:
    cd backend && uv sync

# Install frontend dependencies.
install-frontend:
    cd frontend && npm install

# Regenerate the backend lock file.
lock:
    cd backend && uv lock

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------

# Run the backend API with autoreload.
run-backend:
    cd backend && uv run uvicorn app.main:app --reload

# Run the backend API bound to all interfaces, reachable from the LAN
# (pair with `npm run network` on the frontend).
run-backend-network:
    cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0

# Run the frontend dev server.
run-frontend:
    cd frontend && npm run dev

# Build the production frontend bundle.
build-frontend:
    cd frontend && npm run build

# ---------------------------------------------------------------------------
# Quality
# ---------------------------------------------------------------------------

# Run the backend test suite.
test:
    cd backend && uv run pytest

# Run the backend tests with a coverage report.
test-cov:
    cd backend && uv run pytest --cov=app --cov-report=term-missing

# ---------------------------------------------------------------------------
# Docker
# ---------------------------------------------------------------------------

# Build both container images.
docker-build:
    docker compose build

# Start the full stack in the background.
docker-up:
    docker compose up -d

# Stop the stack (keeps the database volume).
docker-down:
    docker compose down

# Follow container logs.
docker-logs:
    docker compose logs -f

# ---------------------------------------------------------------------------
# Database & backups
# ---------------------------------------------------------------------------

# Start only the local MySQL container (useful with `just run-backend`).
db-up:
    docker compose up -d db

# Apply Alembic migrations against the configured database.
migrate:
    cd backend && uv run alembic upgrade head

# Create a new Alembic revision (autogenerate from model changes).
revision message:
    cd backend && uv run alembic revision --autogenerate -m "{{message}}"

# Run an on-demand backup now (defaults: daily tier, keep 5).
backup-now tier="daily" keep="5":
    docker compose run --rm backup /usr/local/bin/run_backup.sh {{tier}} {{keep}}
