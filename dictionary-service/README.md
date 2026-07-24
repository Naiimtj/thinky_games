# Dictionary Service

Independent dictionary API for word games (Spanish, English, German).

## Development

```bash
cd dictionary-service
uv sync
uv run uvicorn app.main:app --reload --port 8100
```

## Docker

```bash
docker compose up -d dictionary-db dictionary-service
```

## API

- `GET /health` — health check
- `GET /words/{language}` — list words
- `GET /words/{language}/count` — count words
- `GET /words/{language}/count/all` — count all languages
- `GET /words/{language}/{word_id}` — get one word
- `POST /words/{language}` — create word (admin)
- `POST /words/{language}/import` — bulk import (admin)
- `PATCH /words/{language}/{word_id}` — update word (admin)
- `DELETE /words/{language}/{word_id}` — delete word (admin)

Admin endpoints require the header `X-Admin-Password`.
