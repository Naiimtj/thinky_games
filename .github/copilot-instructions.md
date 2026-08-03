# Copilot Instructions For Thinky Games

## Goal

Use these rules to avoid repeated exploration and reduce unnecessary token/tool usage.

## Architecture Snapshot

- Frontend: `frontend` (React + Vite)
- Backend API: `backend` (FastAPI + SQLAlchemy + Alembic)
- Dictionary service: `dictionary-service` (FastAPI + PostgreSQL)
- Main DB: MySQL 8

## High-Value Facts (do not re-discover unless changed)

- Alembic head is `005_user_privacy`.
- Avatar upload uses Cloudinary in folder `thinkyGames`, URL stored in `users.avatar_url`.
- Avatar max size is `5MB`.
- Allowed avatar formats are PNG/JPG/WEBP.
- Frontend profile upload UI already uses `limitSizeFile="5"`.

## Preferred Fast Paths

- For backend profile/avatar issues, start with:
  - `backend/app/routers/users.py`
  - `backend/tests/test_users.py`
- For daily puzzle behavior, start with:
  - `backend/app/core/crud/puzzles.py`
  - `backend/app/core/games/daily.py`
- For API base URL/CORS behavior, start with:
  - `frontend/src/api/apiConfig.js`
  - `backend/app/main.py`
  - `backend/app/config/env.py`

## Standard Verification Commands

- Backend focused tests:
  - `cd backend && uv run pytest tests/test_users.py -q`
- Full backend tests:
  - `cd backend && uv run pytest`
- Frontend build smoke check:
  - `cd frontend && npm run build`
- Migration chain check:
  - `cd backend && uv run alembic heads`

## Migration Policy

- Prefer additive/idempotent migrations with `inspect()` guards.
- If migration history is squashed, update this file and `.github/repo-context.md` in the same PR.
- Never assume old revisions exist in all environments; document `stamp --purge` fallback when needed.

## Scope Discipline

- Avoid scanning `backend/.venv/**` or `node_modules/**` unless explicitly needed.
- Prefer targeted `rg` queries in `backend/app`, `frontend/src`, `dictionary-service/app`, and `backend/alembic/versions`.
- Keep edits minimal and avoid reformatting unrelated files.
