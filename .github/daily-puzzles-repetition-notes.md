# Daily Puzzles Repetition Notes

Last validated: 2026-07-30 (local Docker DB)

## Scope checked

- Table: `daily_puzzles`
- Games: `zip`, `queens`, `patches`
- Locale present in DB: `es`
- Date window present in DB during check: `2026-07-24` to `2026-08-06`

## Findings

- No repetition detected for `zip`, `queens`, or `patches` in stored rows.
- For each game in `es` locale:
  - `total_rows = 14`
  - `distinct_seeds = 14`
  - `duplicate_seed_groups = 0`
  - `duplicate_payload_groups = 0`

## Why users may still perceive repetition

- Daily generation is deterministic by date seed (`year * 1000 + day_of_year`).
- If live generation fails, API serves the latest stored puzzle as fallback.
- That fallback can make players see the same puzzle across days even when the table does not store duplicated rows for new dates.

## Relevant code pointers

- Daily seed formula: `backend/app/core/games/daily.py` (`daily_seed`)
- Generate and store per date: `backend/app/core/crud/puzzles.py` (`_generate_and_store`)
- Fallback to latest stored puzzle on generation error: `backend/app/core/crud/puzzles.py` (`serve_daily_puzzle`)
- One row per game+locale+date: `backend/app/core/database/models.py` (`uq_daily_puzzle_game_locale_date`)

## Re-check SQL (inside MySQL container)

Use this query to verify duplicates by seed and by payload hash:

```sql
WITH games AS (
  SELECT 'zip' AS game_type
  UNION ALL SELECT 'queens'
  UNION ALL SELECT 'patches'
),
locales AS (
  SELECT DISTINCT locale
  FROM daily_puzzles
  WHERE game_type IN ('zip', 'queens', 'patches')
),
base AS (
  SELECT g.game_type, l.locale
  FROM games g
  CROSS JOIN locales l
),
dup_seed AS (
  SELECT game_type, locale, COUNT(*) AS cnt
  FROM (
    SELECT game_type, locale, seed
    FROM daily_puzzles
    WHERE game_type IN ('zip', 'queens', 'patches')
    GROUP BY game_type, locale, seed
    HAVING COUNT(*) > 1
  ) s
  GROUP BY game_type, locale
),
dup_payload AS (
  SELECT game_type, locale, COUNT(*) AS cnt
  FROM (
    SELECT game_type, locale, MD5(CAST(payload AS CHAR(65535))) AS payload_hash
    FROM daily_puzzles
    WHERE game_type IN ('zip', 'queens', 'patches')
    GROUP BY game_type, locale, payload_hash
    HAVING COUNT(*) > 1
  ) p
  GROUP BY game_type, locale
),
totals AS (
  SELECT
    game_type,
    locale,
    COUNT(*) AS total_rows,
    COUNT(DISTINCT seed) AS distinct_seeds,
    MIN(puzzle_date) AS first_date,
    MAX(puzzle_date) AS last_date
  FROM daily_puzzles
  WHERE game_type IN ('zip', 'queens', 'patches')
  GROUP BY game_type, locale
)
SELECT
  b.game_type,
  b.locale,
  COALESCE(t.total_rows, 0) AS total_rows,
  COALESCE(t.distinct_seeds, 0) AS distinct_seeds,
  COALESCE(ds.cnt, 0) AS duplicate_seed_groups,
  COALESCE(dp.cnt, 0) AS duplicate_payload_groups,
  t.first_date,
  t.last_date
FROM base b
LEFT JOIN totals t
  ON t.game_type = b.game_type
 AND t.locale = b.locale
LEFT JOIN dup_seed ds
  ON ds.game_type = b.game_type
 AND ds.locale = b.locale
LEFT JOIN dup_payload dp
  ON dp.game_type = b.game_type
 AND dp.locale = b.locale
ORDER BY b.game_type, b.locale;
```
