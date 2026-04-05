# Release Notes - Role Capability Separation

Date: 2026-04-06
Commit: `c0a1cf2`

## Highlights

- Enforced capability-first role separation across backend and frontend.
- Viewers now stay in report mode, while Analysts/Admins get investigation tools.
- Added monthly period comparison for Analyst/Admin users.

## Backend

- Added analyst-or-admin authorization guard in `backend/app/dependencies/permissions.py`.
- Restricted insight endpoints to Analyst/Admin:
  - `GET /api/v1/dashboard/by-category`
  - `GET /api/v1/dashboard/trends`
  - `GET /api/v1/dashboard/comparison`
- Added monthly comparison endpoint:
  - `GET /api/v1/dashboard/comparison?period_a=YYYY-MM&period_b=YYYY-MM`
- Restricted advanced records filters (`search`, `amount_min`, `amount_max`) to Analyst/Admin on `GET /api/v1/records`.

## Frontend

- Updated dashboard role UX:
  - Viewer: summary + recent records only.
  - Analyst/Admin: category breakdown, trends, and monthly comparison.
- Updated records role UX:
  - Viewer: basic filters only (`type`, `category`, `date_from`, `date_to`).
  - Analyst/Admin: advanced filters (`search`, `amount_min`, `amount_max`).
- Fixed records date query key mapping to backend contract (`date_from`, `date_to`).

## API and Docs

- Regenerated OpenAPI spec and frontend API types.
- Updated role matrix and API docs:
  - `README.md`
  - `docs/api.md`
  - `docs/architecture.md`

## Verification

- Backend tests: `62 passed`
- Frontend tests: `20 passed`
- Frontend production build: successful
