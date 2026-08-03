# Repo Context For Future Sessions

Purpose: quick orientation so future work starts with the right folders, services, and checks.

## Workspace map

- Root project: thinky-games
- Backend API: backend
- Dictionary microservice: dictionary-service
- Frontend app: frontend
- Infra and orchestration: docker-compose.yml, docker-compose.override.yml, docker-compose.prod.yml

## Current schema baseline (important)

- Alembic head is a single consolidated migration: `005_user_privacy`.
- Migration `005_user_privacy` includes:
  - `users.share_results_globally`
  - `users.avatar_url`
  - `friend_preferences` table
- Older split migrations (`006_user_avatar`, `007_avatar_url_mediumtext`) were removed after squash.
- If an environment already points to removed revisions, align with:
  - `alembic stamp --purge 005_user_privacy`

## Avatar storage (current behavior)

- Avatar images are uploaded to Cloudinary.
- Public URL is stored in `users.avatar_url`.
- Cloudinary folder: `thinkyGames`.
- Max avatar size: `5MB`.
- Allowed formats: `png`, `jpg/jpeg`, `webp`.

## Where core game logic lives

- Game generators and validators: backend/app/core/games
- Daily puzzle read/write flow: backend/app/core/crud/puzzles.py
- Daily seed formula: backend/app/core/games/daily.py
- DB ORM models: backend/app/core/database/models.py
- Game routes: backend/app/routers/games.py

## Local Docker services seen in this repo

- MySQL container name: thinky-mysql
- Dictionary DB container name: thinky-dictionary-db
- Dictionary service container name: thinky-dictionary-service

## Local MySQL access used in this project

- Host: 127.0.0.1
- Port: 3307
- User: thinky
- Password: thinky
- Database: thinky_games
- Important table for dailies: daily_puzzles

## Daily puzzles behavior to remember

- A puzzle row is unique by game_type + locale + puzzle_date.
- Seed is deterministic by UTC date.
- If live generation fails, backend can serve the latest stored puzzle as fallback.
- This can look like repetition to players even when there are no duplicated rows for new dates.

## Fast checks that are usually useful

- List project folders quickly:
  - ls
- Locate backend files:
  - rg --files backend
- Check available daily tables:
  - docker exec -i thinky-mysql mysql -uthinky -pthinky -D thinky_games -e "SHOW TABLES;"
- Quick count by game_type:
  - docker exec -i thinky-mysql mysql -uthinky -pthinky -D thinky_games -e "SELECT game_type, COUNT(\*) total FROM daily_puzzles GROUP BY game_type ORDER BY total DESC;"

- Verify Alembic chain quickly:
  - cd backend && uv run alembic heads

- Run focused profile/avatar tests:
  - cd backend && uv run pytest tests/test_users.py -q

## Related note

- Detailed repetition investigation and SQL audit query:
  - .github/daily-puzzles-repetition-notes.md
