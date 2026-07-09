"""FastAPI application entry point."""

import logging
import subprocess
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.env import get_settings
from app.core.crud.puzzles import top_up_buffer
from app.core.database.database import SessionLocal
from app.core.database.seed import run_seed
from app.routers import auth, backup, games, health, scores

settings = get_settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("thinky-games")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup: run migrations + seed (skipped during tests) ---
    if settings.run_migrations_on_startup:
        logger.info("Running Alembic migrations...")
        result = subprocess.run(
            [sys.executable, "-m", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            logger.info("Migrations completed successfully.")
        else:
            logger.error("Migration failed: %s", result.stderr.strip())

        logger.info("Running seed data...")
        db = SessionLocal()
        try:
            seed_result = run_seed(db)
            logger.info("Seed completed: %s", seed_result)
        except Exception as exc:  # pragma: no cover - defensive startup guard
            logger.error("Seed failed: %s", exc)
        finally:
            db.close()

        logger.info("Topping up daily puzzle buffer...")
        db = SessionLocal()
        try:
            created = top_up_buffer(db)
            logger.info("Puzzle buffer ready: %s new puzzles generated.", created)
        except Exception as exc:  # pragma: no cover - defensive startup guard
            logger.error("Puzzle buffer top-up failed: %s", exc)
        finally:
            db.close()

    yield
    # --- Shutdown: nothing to clean up ---


app = FastAPI(title="Thinky Games API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(scores.router)
app.include_router(games.router)
app.include_router(backup.router)
