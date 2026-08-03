## Summary

-

## Why

-

## Scope

- Backend:
- Frontend:
- Dictionary service:
- Infra:

## Migration Impact

- [ ] No schema change
- [ ] Schema change included
- [ ] Requires `alembic upgrade head`
- [ ] Requires revision realignment (`alembic stamp --purge 005_user_privacy`)

## Tests Run

- [ ] `cd backend && uv run pytest tests/test_users.py -q`
- [ ] `cd backend && uv run pytest`
- [ ] `cd frontend && npm run build`
- [ ] Other:

## Checklist

- [ ] Updated `.github/repo-context.md` if architecture/ops behavior changed
- [ ] Updated docs/README if developer workflow changed
- [ ] Kept changes limited to task scope
