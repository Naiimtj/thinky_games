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

# Start only the dictionary PostgreSQL container.
dict-db-up:
    docker compose up -d dictionary-db

# Run the dictionary service locally (requires dict-db-up or external Postgres).
run-dictionary:
    cd dictionary-service && uv run uvicorn app.main:app --reload --port 8100

# Apply Alembic migrations against the configured database.
migrate:
    cd backend && uv run alembic upgrade head

# Create a new Alembic revision (autogenerate from model changes).
revision message:
    cd backend && uv run alembic revision --autogenerate -m "{{message}}"

# Run an on-demand backup now (defaults: daily tier, keep 5).
backup-now tier="daily" keep="5":
    docker compose run --rm backup /usr/local/bin/run_backup.sh {{tier}} {{keep}}

# ---------------------------------------------------------------------------
# Production server (docker-compose.prod.yml)
# ---------------------------------------------------------------------------

# Rebuild and recreate only backend + frontend (keeps db/backup and volumes untouched).
prod-rebuild-app:
    docker compose -f docker-compose.prod.yml up -d --build backend frontend

# Deploy or update the dictionary service and its Postgres database in production.
prod-deploy-dictionary:
    docker compose -f docker-compose.prod.yml up -d --build dictionary-db dictionary-service

# Full production deploy: app + dictionary service.
# On the server this exposes DB ports on 127.0.0.1:3306 / 127.0.0.1:5433.
prod-deploy:
    docker compose -f docker-compose.prod.yml up -d --build

# Local production deploy with alternate DB ports to avoid conflicts (e.g. DataGrip on 3306).
# Uses docker-compose.override.yml if present. MySQL -> 3307, PostgreSQL -> 5434.
prod-deploy-local:
    docker compose -f docker-compose.prod.yml -f docker-compose.override.yml up -d --build

# Seed the production dictionary DB by running the seed script inside a one-off container.
# This drops and recreates the dictionary PostgreSQL database used by the live service.
prod-seed-dictionary:
    docker compose -f docker-compose.prod.yml up -d dictionary-db
    docker compose -f docker-compose.prod.yml run --rm dictionary-service uv run python scripts/seed_dictionary.py
    docker compose -f docker-compose.prod.yml restart dictionary-service

# Same as prod-seed-dictionary but for a local deploy started with `prod-deploy-local`.
prod-seed-dictionary-local:
    docker compose -f docker-compose.prod.yml -f docker-compose.override.yml up -d dictionary-db
    docker compose -f docker-compose.prod.yml -f docker-compose.override.yml run --rm dictionary-service uv run python scripts/seed_dictionary.py
    docker compose -f docker-compose.prod.yml -f docker-compose.override.yml restart dictionary-service

# Regenerate all daily puzzles in the production backend container.
prod-regenerate-all-puzzles:
    docker compose -f docker-compose.prod.yml exec -T backend uv run python scripts/regenerate_daily_puzzles.py --all-games --delete-existing --days 14

# Same as prod-regenerate-all-puzzles but for a local deploy started with `prod-deploy-local`.
prod-regenerate-all-puzzles-local:
    docker compose -f docker-compose.prod.yml -f docker-compose.override.yml exec -T backend uv run python scripts/regenerate_daily_puzzles.py --all-games --delete-existing --days 14

# Wipe dictionary DB and regenerate all daily puzzles in production.
prod-rebuild-content: prod-seed-dictionary prod-regenerate-all-puzzles
    @echo "Production content rebuild complete."

# Wipe dictionary DB and regenerate all daily puzzles in a local deploy.
prod-rebuild-content-local: prod-seed-dictionary-local prod-regenerate-all-puzzles-local
    @echo "Local production content rebuild complete."

# ---------------------------------------------------------------------------
# Dictionary service seeding (useful when rebuilding the server from scratch)
# ---------------------------------------------------------------------------

# Rebuild the dictionary database from scratch and import Spanish/English/German seeds.
# WARNING: this drops the dictionary PostgreSQL database and recreates it.
seed-dictionary: dict-db-up
    cd dictionary-service && DATABASE_URL=postgresql+psycopg2://dict:dict@localhost:5433/dictionary uv run python scripts/seed_dictionary.py

# Import dictionary seeds assuming the service and DB are already running.
import-dictionary-seeds:
    cd dictionary-service && curl -s -X POST http://127.0.0.1:8100/words/es/import -H "Content-Type: application/json" -H "X-Admin-Password: thinky" --data @scripts/es_words_15k.json
    cd dictionary-service && curl -s -X POST http://127.0.0.1:8100/words/en/import -H "Content-Type: application/json" -H "X-Admin-Password: thinky" --data @scripts/en_words_15k.json
    cd dictionary-service && curl -s -X POST http://127.0.0.1:8100/words/de/import -H "Content-Type: application/json" -H "X-Admin-Password: thinky" --data @scripts/de_words_15k.json

# ---------------------------------------------------------------------------
# Daily puzzle regeneration
# ---------------------------------------------------------------------------

# Regenerate daily puzzles for wend, pinpoint and crossword across es/en/de.
regenerate-puzzles:
    cd backend && uv run python scripts/regenerate_daily_puzzles.py --games wend pinpoint crossword --delete-existing --days 14

# Regenerate daily puzzles for all playable games across all locales.
regenerate-all-puzzles:
    cd backend && uv run python scripts/regenerate_daily_puzzles.py --all-games --delete-existing --days 14

# Truncate all pregenerated daily puzzles so they get regenerated on next backend start.
reset-puzzles:
    cd backend && uv run python -c "from sqlalchemy import create_engine, text; from app.config.env import get_settings; engine = create_engine(get_settings().database_url); conn=engine.begin(); conn.execute(text('TRUNCATE TABLE daily_puzzles')); conn.commit(); print('daily_puzzles truncated.')"

# Truncate all pregenerated daily puzzles inside the Docker MySQL container.
prod-reset-puzzles:
    docker exec -it thinky-mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "TRUNCATE TABLE thinky_games.daily_puzzles;"

# ---------------------------------------------------------------------------
# Full server rebuild from scratch
# ---------------------------------------------------------------------------

# Wipe and recreate the dictionary DB, then regenerate all daily puzzles.
# Useful after copying the project to a fresh server.
rebuild-content: seed-dictionary regenerate-all-puzzles
    @echo "Content rebuild complete. Dictionary + daily puzzles ready."

# Truncate puzzles for a single game type, e.g. `just prod-reset-puzzle tango`.
prod-reset-puzzle game_type:
    docker exec -it thinky-mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "DELETE FROM thinky_games.daily_puzzles WHERE game_type='{{game_type}}';"

# Reset all puzzles and restart the backend so the buffer regenerates them.
prod-rebuild-puzzles: prod-reset-puzzles
    docker restart thinky-backend
