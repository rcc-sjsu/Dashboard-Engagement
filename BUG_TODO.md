# Bug Audit TODO

Date: 2026-04-25
Scope: `apps/server`, `apps/web`, monorepo task wiring

## Critical

- [x] **API errors are returned as HTTP 200 instead of 5xx**
  - File: `apps/server/app/routes/analytics.py` (lines 22-24, 41-42, 56-57, 87-88, 98-99)
  - Problem: broad `except Exception` returns `{"detail": ...}` directly, which defaults to status 200.
  - Impact: frontend/monitoring cannot reliably detect failures; broken data can be treated as success.
  - Fix: replace these branches with `raise HTTPException(status_code=500, detail="...")` and log server-side details.

- [x] **Backend secret is used in client-side fetch path**
  - File: `apps/web/src/lib/api-client.ts` (lines 15-25, 68-81)
  - Problem: `authenticatedFetch` runs in client components and injects `Authorization: Bearer <secret>`.
  - Impact: requires exposing internal API secret to browser (`NEXT_PUBLIC_*`), which is a credential leak.
  - Fix: keep secret usage server-only (`authenticatedServerFetch`), and proxy client calls through Next.js server routes/actions without exposing secret.

## High

- [x] **DB connection kwargs can be `None` and crash with `TypeError`**
  - File: `apps/server/app/db.py` (lines 18-21, 28-31)
  - Problem: `_get_connection_kwargs()` returns nothing when `DATABASE_URL` is unset, then `**None` is used.
  - Impact: startup/runtime failure path is confusing and unhandled.
  - Fix: return `{}` or explicitly raise a clear `RuntimeError("DATABASE_URL is required")`.

- [x] **Retention query double-counts people when same email has multiple categories**
  - File: `apps/server/app/services/retention.py` (lines 37-77 and 80-123)
  - Problem: `people` CTE uses `UNION` on `(email, major_category)` instead of one row per email.
  - Impact: inflated overall and by-major retention counts.
  - Fix: canonicalize to one row per email (e.g., `DISTINCT ON (email)` with source precedence: members > attendance) before joining attendance counts.

- [x] **Class year aggregation can split NULL/empty into duplicate “Other/Unknown” rows**
  - File: `apps/server/app/services/mission.py` (lines 68-94 and 111-126)
  - Problem: select uses `COALESCE(NULLIF(...), 'Other/Unknown')` but groups by raw `class_year`.
  - Impact: duplicate labels with fragmented counts.
  - Fix: `GROUP BY 1` (or group by the normalized expression), and order on normalized alias.

## Medium

- [x] **Client import flow hard-requires `SERVER_URL` env even when using relative API route**
  - File: `apps/web/src/components/admin/AdminImportPanel.tsx` (lines 497-502)
  - Problem: import aborts if env var missing before calling `authenticatedFetch("/api/import/...")`.
  - Impact: unnecessary production/runtime blocker.
  - Fix: remove this check for client calls to local `/api/*` routes.

- [x] **Monorepo typecheck pipeline is effectively a no-op**
  - Files: `turbo.json` (lines 13-15), root `package.json` (line 19), app packages lack `check-types` scripts
  - Problem: `bun run check-types` reports “No tasks were executed”.
  - Impact: TS regressions are not caught in CI/dev.
  - Fix: add `check-types` scripts in `apps/web`, `packages/*` as needed, and ensure Turbo tasks map to them.

## Suggested Execution Order

1. Fix HTTP status handling in analytics routes.
2. Remove client-side secret usage and move protected calls server-side.
3. Fix retention counting logic and mission class-year grouping.
4. Harden DB connection error handling.
5. Restore real typecheck tasks in Turbo.
6. Remove unnecessary `SERVER_URL` gate in admin import UI.
