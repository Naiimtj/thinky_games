<p align="center">
  <img src="frontend/static/images/logo.png" alt="Thinky Games logo" width="88" />
</p>

<h1 align="center">Thinky Games</h1>

<p align="center">
  A browser-based collection of daily logic puzzles. Play a quick demo, return for a fresh daily challenge, and compare your time on the leaderboard.
</p>

<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18" /></a>
  <a href="https://vite.dev"><img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite 5" /></a>
  <a href="https://fastapi.tiangolo.com"><img src="https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white" alt="FastAPI" /></a>
  <a href="https://www.docker.com"><img src="https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" /></a>
</p>

![Thinky Games home screen with daily puzzle cards](docs/thinky-games-home.png)

> [!IMPORTANT]
> **What it does:** Thinky Games brings several short puzzle formats into one place, with guest demos, authenticated daily games, saved results, and a ranking system.

## Install and run

> [!NOTE]
> You need Node.js with npm, Python 3.11-3.13, [uv](https://docs.astral.sh/uv/), and Docker Compose. Docker runs the local MySQL database.

1. **Clone the repository.** Copy its URL from GitHub's **Code** menu.

   ```bash
   git clone <repository-url>
   cd thinky-games
   ```

2. **Start MySQL.**

   ```bash
   docker compose up -d db
   ```

3. **Install the backend and frontend dependencies.**

   ```bash
   (cd backend && uv sync)
   (cd frontend && npm install)
   ```

4. **Run the API** in one terminal.

   ```bash
   cd backend
   uv run uvicorn app.main:app --reload
   ```

5. **Run the web app** in a second terminal.

   ```bash
   cd frontend
   npm run dev
   ```

Open [localhost:5173](http://localhost:5173) to play. The API documentation is available at [localhost:8000/docs](http://localhost:8000/docs).

> [!TIP]
> From the repository root, `just install`, `just db-up`, `just run-backend`, and `just run-frontend` provide the same development workflow through the included task runner.

### Run the full stack with Docker

```bash
docker compose up --build
```

Open [localhost:8080](http://localhost:8080). Stop the stack with `docker compose down`.

## Features

- Daily puzzle sessions with a countdown to the next challenge.
- Guest demo mode alongside authenticated daily play.
- Puzzle completion times, persistent scores, and protected leaderboards.
- Eight puzzle formats: Zip, Queens, Tango, Mini Sudoku, Pinpoint, Crossword, Wend, and Patches.
- English, Spanish, and German interface translations.
- Database migrations, automated puzzle generation, and backup support.
- A container-ready development and deployment setup.

## Stack

| Layer    | Technology                                  |
| -------- | ------------------------------------------- |
| Web app  | React, Vite, Tailwind CSS, Zustand, i18next |
| API      | FastAPI, SQLAlchemy, Alembic                |
| Database | MySQL 8                                     |
| Tooling  | uv, pytest, Vitest, Docker Compose, Just    |

## Useful commands

```bash
just test              # Run backend tests
just test-cov          # Run backend tests with coverage
just build-frontend    # Create the production web bundle
docker compose logs -f # Follow all container logs
```
