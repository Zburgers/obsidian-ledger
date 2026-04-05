# FinTrack MVP (Backend-First + Minimal Frontend) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Dockerized FinTrack MVP with backend-complete core features plus a minimal React frontend that fully exercises auth, records, dashboard, users, and export flows.

**Architecture:** Implement vertical slices in backend-first order (`auth -> users -> records -> dashboard -> export`) and attach thin frontend pages per slice. Keep RBAC and data scoping enforced on backend dependencies/services, generate OpenAPI automatically via FastAPI, and generate frontend TypeScript API types from the OpenAPI contract.

**Tech Stack:** FastAPI, SQLAlchemy 2 async, Alembic, PostgreSQL 15, JWT (python-jose/passlib), slowapi, pytest/httpx, React + Vite + TypeScript, Docker Compose

---

### Task 1: Repository Skeleton + Docker Compose Foundation

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `frontend/Dockerfile`
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `.gitignore`

**Step 1: Write the failing test/check**

Create a smoke script expectation in plan notes: Compose config should parse.

**Step 2: Run check to verify it fails initially**

Run: `docker compose config`
Expected: FAIL before files exist.

**Step 3: Write minimal implementation**

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: fintrack
      POSTGRES_PASSWORD: fintrack
      POSTGRES_DB: fintrack
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  backend:
    build: ./backend
    env_file: ./backend/.env.example
    ports: ["8000:8000"]
    depends_on: [db]

  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    depends_on: [backend]

volumes:
  pgdata:
```

**Step 4: Run check to verify it passes**

Run: `docker compose config`
Expected: PASS with normalized YAML output.

**Step 5: Commit**

```bash
git add docker-compose.yml backend frontend .gitignore
git commit -m "chore: scaffold dockerized backend and frontend services"
```

---

### Task 2: Backend App Core (Config, DB, Models, Alembic)

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/db/base.py`
- Create: `backend/app/models/user.py`
- Create: `backend/app/models/record.py`
- Create: `backend/alembic.ini`
- Create: `backend/alembic/env.py`
- Create: `backend/alembic/versions/0001_init_schema.py`
- Test: `backend/tests/integration/test_health.py`

**Step 1: Write the failing test**

```python
async def test_health_returns_ok(client):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/integration/test_health.py -v`
Expected: FAIL (app/import missing).

**Step 3: Write minimal implementation**

```python
# backend/app/main.py
from fastapi import FastAPI

app = FastAPI(title="FinTrack API", version="1.0.0")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

Also add SQLAlchemy models with enums (`viewer|analyst|admin`, `income|expense`), soft-delete columns, and Alembic migration creating tables + indexes from spec.

**Step 4: Run tests and migration checks**

Run: `cd backend && alembic upgrade head && pytest tests/integration/test_health.py -v`
Expected: Alembic applies schema; test PASS.

**Step 5: Commit**

```bash
git add backend/app backend/alembic* backend/tests/integration/test_health.py
git commit -m "feat: initialize backend core models and migrations"
```

---

### Task 3: Auth Slice (Register + Login + Refresh + Current User Dependency)

**Files:**
- Create: `backend/app/api/v1/auth.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/services/auth_service.py`
- Create: `backend/app/core/security.py`
- Create: `backend/app/dependencies/auth.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/integration/test_auth_routes.py`

**Step 1: Write failing tests**

```python
async def test_register_creates_viewer(client): ...
async def test_login_returns_access_and_refresh(client): ...
async def test_refresh_returns_new_access(client): ...
```

**Step 2: Run tests to verify failure**

Run: `pytest backend/tests/integration/test_auth_routes.py -v`
Expected: FAIL (404 routes / missing handlers).

**Step 3: Write minimal implementation**

```python
@router.post("/register", status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    return await auth_service.register_viewer(db, payload)
```

Implement:
- Register defaults role to `viewer` always.
- Duplicate email returns `400` with stable error code.
- Login returns `{access_token, refresh_token, token_type}`.
- Refresh validates refresh token type and user active/non-deleted status.

**Step 4: Run tests**

Run: `pytest backend/tests/integration/test_auth_routes.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/api/v1/auth.py backend/app/services/auth_service.py backend/app/core/security.py backend/app/dependencies/auth.py backend/app/schemas/auth.py backend/tests/integration/test_auth_routes.py
git commit -m "feat: add register login refresh auth flow"
```

---

### Task 4: Frontend Auth Slice (Login/Register + Guarded Routing)

**Files:**
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/features/auth/LoginPage.tsx`
- Create: `frontend/src/features/auth/RegisterPage.tsx`
- Create: `frontend/src/features/auth/authStore.ts`
- Create: `frontend/src/router.tsx`
- Create: `frontend/src/lib/api.ts`
- Test: `frontend/src/features/auth/auth.test.tsx`

**Step 1: Write failing test**

```tsx
it("redirects unauthenticated user to /login", async () => {
  // render protected route
  // expect login form visible
})
```

**Step 2: Run test to verify failure**

Run: `cd frontend && npm test -- auth.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement:
- Login and register forms calling backend endpoints.
- Auth state holding tokens + role.
- Protected route wrapper that redirects if unauthenticated.

**Step 4: Run tests + dev build**

Run: `cd frontend && npm test -- auth.test.tsx && npm run build`
Expected: PASS + Vite build success.

**Step 5: Commit**

```bash
git add frontend/src frontend/package.json frontend/tsconfig.json frontend/vite.config.ts
git commit -m "feat: add frontend auth flow and protected routing"
```

---

### Task 5: Users Slice (Admin API + Minimal Users Page)

**Files:**
- Create: `backend/app/api/v1/users.py`
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/services/user_service.py`
- Create: `backend/app/dependencies/permissions.py`
- Test: `backend/tests/integration/test_users_routes.py`
- Create: `frontend/src/features/users/UsersPage.tsx`
- Create: `frontend/src/features/users/UserForm.tsx`
- Test: `frontend/src/features/users/users.test.tsx`

**Step 1: Write failing backend tests**

```python
async def test_admin_can_list_users(client, admin_token): ...
async def test_viewer_gets_403_on_users_list(client, viewer_token): ...
```

**Step 2: Run tests to verify failure**

Run: `pytest backend/tests/integration/test_users_routes.py -v`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement:
- `GET/POST/PATCH/DELETE /users` admin-only.
- Soft-delete behavior.
- Pagination defaults.
- Frontend admin-only users page (list + create + role/status edit).

**Step 4: Run backend and frontend tests**

Run: `pytest backend/tests/integration/test_users_routes.py -v && cd frontend && npm test -- users.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/api/v1/users.py backend/app/services/user_service.py backend/app/schemas/user.py backend/app/dependencies/permissions.py backend/tests/integration/test_users_routes.py frontend/src/features/users
git commit -m "feat: implement admin user management endpoints and page"
```

---

### Task 6: Records Slice (CRUD + Filters + Pagination + Minimal Records UI)

**Files:**
- Create: `backend/app/api/v1/records.py`
- Create: `backend/app/schemas/record.py`
- Create: `backend/app/services/record_service.py`
- Test: `backend/tests/integration/test_records_routes.py`
- Create: `frontend/src/features/records/RecordsPage.tsx`
- Create: `frontend/src/features/records/RecordForm.tsx`
- Create: `frontend/src/features/records/RecordDetailPage.tsx`
- Test: `frontend/src/features/records/records.test.tsx`

**Step 1: Write failing tests**

```python
async def test_viewer_sees_only_own_records(client, viewer_token): ...
async def test_admin_can_create_update_delete_record(client, admin_token): ...
```

**Step 2: Run tests to verify failure**

Run: `pytest backend/tests/integration/test_records_routes.py -v`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement:
- Record CRUD with admin writes only.
- Viewer scoping in service query.
- Combined filters (`type`, `category`, `date_from`, `date_to`, `search`) + pagination.
- Frontend records list, create/edit admin form, detail page.

**Step 4: Run tests/build**

Run: `pytest backend/tests/integration/test_records_routes.py -v && cd frontend && npm test -- records.test.tsx && npm run build`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/api/v1/records.py backend/app/services/record_service.py backend/app/schemas/record.py backend/tests/integration/test_records_routes.py frontend/src/features/records
git commit -m "feat: add record CRUD filtering and records UI"
```

---

### Task 7: Dashboard Slice (Summary/Category/Trends/Recent + Dashboard UI)

**Files:**
- Create: `backend/app/api/v1/dashboard.py`
- Create: `backend/app/schemas/dashboard.py`
- Create: `backend/app/services/dashboard_service.py`
- Test: `backend/tests/integration/test_dashboard_routes.py`
- Create: `frontend/src/features/dashboard/DashboardPage.tsx`
- Create: `frontend/src/features/dashboard/components/*.tsx`
- Test: `frontend/src/features/dashboard/dashboard.test.tsx`

**Step 1: Write failing backend tests**

```python
async def test_summary_matches_seed_totals(client, analyst_token): ...
async def test_viewer_summary_is_scoped(client, viewer_token): ...
```

**Step 2: Run tests to verify failure**

Run: `pytest backend/tests/integration/test_dashboard_routes.py -v`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement SQL aggregation in DB queries (`func.sum`, date buckets) for:
- `/dashboard/summary`
- `/dashboard/by-category`
- `/dashboard/trends`
- `/dashboard/recent`

Implement frontend KPI cards + charts + recent list consuming API output.

**Step 4: Run tests/build**

Run: `pytest backend/tests/integration/test_dashboard_routes.py -v && cd frontend && npm test -- dashboard.test.tsx && npm run build`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/api/v1/dashboard.py backend/app/services/dashboard_service.py backend/app/schemas/dashboard.py backend/tests/integration/test_dashboard_routes.py frontend/src/features/dashboard
git commit -m "feat: add dashboard analytics endpoints and dashboard page"
```

---

### Task 8: Export Slice (CSV + PDF) + Frontend Export Actions

**Files:**
- Create: `backend/app/api/v1/export.py`
- Create: `backend/app/services/export_service.py`
- Test: `backend/tests/integration/test_export_routes.py`
- Modify: `frontend/src/features/records/RecordsPage.tsx`
- Test: `frontend/src/features/records/export.test.tsx`

**Step 1: Write failing tests**

```python
async def test_csv_export_returns_file(client, analyst_token): ...
async def test_viewer_export_is_scoped(client, viewer_token): ...
```

**Step 2: Run tests to verify failure**

Run: `pytest backend/tests/integration/test_export_routes.py -v`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement:
- `GET /export/csv` streaming response from filtered/scoped records query.
- `GET /export/pdf` generated report using selected PDF library.
- Frontend buttons that pass active filters and download files.

**Step 4: Run tests/build**

Run: `pytest backend/tests/integration/test_export_routes.py -v && cd frontend && npm test -- export.test.tsx && npm run build`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/api/v1/export.py backend/app/services/export_service.py backend/tests/integration/test_export_routes.py frontend/src/features/records/RecordsPage.tsx frontend/src/features/records/export.test.tsx
git commit -m "feat: implement csv/pdf export endpoints and ui actions"
```

---

### Task 9: OpenAPI + Generated Frontend Types + Typed API Layer

**Files:**
- Modify: `backend/app/main.py`
- Create: `frontend/src/types/api.ts`
- Create: `frontend/scripts/generate-api-types.mjs`
- Modify: `frontend/package.json`
- Test: `frontend/src/lib/api-contract.test.ts`

**Step 1: Write failing contract check**

```ts
it("api types include AuthLoginResponse", () => {
  expect(AuthLoginResponse).toBeDefined()
})
```

**Step 2: Run check to verify failure**

Run: `cd frontend && npm run gen:types`
Expected: FAIL before generator exists.

**Step 3: Write minimal implementation**

Implement script that fetches `http://localhost:8000/openapi.json` and generates `src/types/api.ts` (e.g., `openapi-typescript`).

**Step 4: Run generation + tests**

Run: `cd frontend && npm run gen:types && npm test -- api-contract.test.ts`
Expected: PASS and types file generated.

**Step 5: Commit**

```bash
git add backend/app/main.py frontend/scripts/generate-api-types.mjs frontend/src/types/api.ts frontend/package.json frontend/src/lib/api-contract.test.ts
git commit -m "chore: generate typed frontend client models from openapi"
```

---

### Task 10: Rate Limits, Error Shape, and Cross-Cutting Middleware

**Files:**
- Create: `backend/app/core/rate_limit.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/api/v1/auth.py`
- Create: `backend/app/core/errors.py`
- Test: `backend/tests/integration/test_rate_limit_and_errors.py`

**Step 1: Write failing tests**

```python
async def test_login_rate_limit_returns_429(client): ...
async def test_error_payload_has_detail_code_field(client): ...
```

**Step 2: Run tests to verify failure**

Run: `pytest backend/tests/integration/test_rate_limit_and_errors.py -v`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement:
- Global and auth-specific slowapi limits.
- Standardized error response helper shape.
- Consistent handlers for 401/403/404/429.

**Step 4: Run tests**

Run: `pytest backend/tests/integration/test_rate_limit_and_errors.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/core/rate_limit.py backend/app/core/errors.py backend/app/main.py backend/app/api/v1/auth.py backend/tests/integration/test_rate_limit_and_errors.py
git commit -m "feat: add rate limiting and standardized error responses"
```

---

### Task 11: Full Test Matrix + Compose Validation + Seed Workflow

**Files:**
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/unit/test_services_smoke.py`
- Create: `scripts/seed_demo_data.py`
- Create: `Makefile`

**Step 1: Write failing aggregate test command**

Define expectation that all tests run green from root with one command.

**Step 2: Run command to verify failure**

Run: `make test`
Expected: FAIL before Makefile/tests are complete.

**Step 3: Write minimal implementation**

Implement Make targets:
- `make up`
- `make migrate`
- `make seed`
- `make test`
- `make down`

Include seed script with admin + sample users + records.

**Step 4: Run verification suite**

Run: `make up && make migrate && make seed && make test`
Expected: PASS backend + frontend tests.

**Step 5: Commit**

```bash
git add backend/tests scripts/seed_demo_data.py Makefile
git commit -m "test: add integrated test workflow and demo seed script"
```

---

### Task 12: Root Documentation (Single Source of Truth)

**Files:**
- Create: `README.md`
- Create: `docs/architecture.md`
- Create: `docs/api.md`

**Step 1: Write failing docs check**

Set requirement: README must include quickstart, env vars, role matrix, API docs URL, and demo flow.

**Step 2: Run docs lint/check**

Run: `markdownlint README.md docs/*.md`
Expected: FAIL before docs exist.

**Step 3: Write minimal implementation**

README sections:
- Project overview and architecture diagram.
- One-command local startup with Docker Compose.
- Env config table.
- Migration and seed instructions.
- Role behavior and security notes.
- OpenAPI usage: `/docs` and `/openapi.json`.
- Frontend routes and screenshot placeholders.

**Step 4: Run docs check**

Run: `markdownlint README.md docs/*.md`
Expected: PASS.

**Step 5: Commit**

```bash
git add README.md docs/architecture.md docs/api.md
git commit -m "docs: add root-level setup architecture and api documentation"
```

---

## Final Verification Gate

Run from repository root:

```bash
docker compose up -d --build
docker compose exec backend alembic upgrade head
docker compose exec backend pytest -q
docker compose exec frontend npm test -- --run
docker compose exec frontend npm run build
```

Expected:
- Backend tests pass
- Frontend tests pass
- Frontend build succeeds
- API docs available at `http://localhost:8000/docs`
- Frontend available at `http://localhost:5173`
