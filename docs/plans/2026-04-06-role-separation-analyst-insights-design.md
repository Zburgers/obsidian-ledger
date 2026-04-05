# Role Separation and Analyst Insights Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce capability-first role separation so Viewers stay read-only/report-focused and Analysts/Admins get monthly insights and advanced interrogation tools.

**Architecture:** Keep current FastAPI + React architecture and add a thin authorization capability layer in backend dependencies. Gate analyst-only APIs server-side, then mirror those capabilities in frontend UI so Viewer surfaces remain clean. Extend dashboard with monthly comparison read-models without changing transaction write paths.

**Tech Stack:** FastAPI, SQLAlchemy async, Pydantic, pytest, React, Zustand, Vitest.

---

### Task 1: Backend permission and dashboard route tests (RED)

**Files:**
- Modify: `backend/tests/integration/test_dashboard_routes.py`
- Modify: `backend/tests/integration/test_records_routes.py`

**Steps:**
1. Add failing tests that Viewer gets `403` on `/api/v1/dashboard/by-category`, `/api/v1/dashboard/trends`, and new `/api/v1/dashboard/comparison`.
2. Add failing tests that Analyst/Admin can access those endpoints.
3. Add failing tests that Viewer cannot use advanced records query (`search`, `amount_min`, `amount_max`) but Analyst can.
4. Run targeted tests and verify failures are authorization-related.

### Task 2: Backend capability enforcement and monthly comparison (GREEN)

**Files:**
- Modify: `backend/app/dependencies/permissions.py`
- Modify: `backend/app/api/v1/dashboard.py`
- Modify: `backend/app/api/v1/records.py`
- Modify: `backend/app/services/dashboard_service.py`
- Modify: `backend/app/schemas/dashboard.py`

**Steps:**
1. Implement role/capability dependency helpers for analyst-or-admin and advanced-records access.
2. Apply guards to analyst-only dashboard routes and advanced record queries.
3. Add `dashboard/comparison` monthly endpoint and service logic.
4. Add response schemas for comparison payload.
5. Run targeted backend tests until green.

### Task 3: Frontend role split tests (RED)

**Files:**
- Modify: `frontend/src/features/dashboard/dashboard.test.tsx`
- Modify: `frontend/src/features/records/records.test.tsx`

**Steps:**
1. Add failing dashboard tests for Viewer-only summary/recent layout without insights panels.
2. Add failing dashboard tests for Analyst comparison panel visibility and API usage.
3. Add failing records tests for Viewer basic filters only and Analyst advanced filter controls.
4. Run targeted frontend tests and verify failures are behavior-related.

### Task 4: Frontend implementation (GREEN)

**Files:**
- Modify: `frontend/src/features/dashboard/DashboardPage.tsx`
- Modify: `frontend/src/features/records/RecordsPage.tsx`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/App.tsx` (only if nav or wording changes needed)

**Steps:**
1. Gate Analyst-only panels by role (`analyst` or `admin`) and keep Viewer in report mode.
2. Add monthly comparison UI and wire new API.
3. Add advanced filter controls for Analyst/Admin only, keep Viewer basic filters.
4. Fix records date filter query names to backend contract (`date_from`, `date_to`).
5. Run targeted frontend tests until green.

### Task 5: Documentation updates

**Files:**
- Modify: `docs/api.md`
- Modify: `docs/architecture.md`
- Modify: `README.md` (if role matrix/features are documented there)

**Steps:**
1. Update role-permission matrix with enforced capability boundaries.
2. Document new analyst-only endpoints and query guard behavior.
3. Document frontend role UX split (Viewer report mode vs Analyst analysis mode).

### Task 6: Verification and release prep

**Files:**
- N/A (commands only)

**Steps:**
1. Run full backend tests.
2. Run frontend tests and build.
3. Sanity-check OpenAPI/client typing if needed.
4. Prepare release commit message and release notes summary.
