# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project follows Semantic Versioning.

## [Unreleased]

## [0.2.0] - 2026-04-06

### Added

- Enforced backend role capability split so Viewer remains report-only while Analyst/Admin can access insights.
- Added monthly comparison endpoint: `GET /api/v1/dashboard/comparison?period_a=YYYY-MM&period_b=YYYY-MM`.
- Added analyst-only advanced records filters: `search`, `amount_min`, `amount_max`.
- Added release notes document at `docs/releases/2026-04-06-role-capability-split.md`.

### Changed

- Dashboard frontend now renders role-specific experience:
  - Viewer: summary + recent records only
  - Analyst/Admin: category breakdown + trends + monthly comparison
- Records frontend now gates advanced filters by role and keeps Viewer to basic filters.
- Docker compose hardened for production-safe defaults (required `SECRET_KEY`, credential-aware DB healthcheck).
- Frontend API resolution updated to support env-driven `localhost:${PORT}` base construction.

### Fixed

- Corrected records date query mapping to backend contract (`date_from`, `date_to`).
- Improved backend/frontend Docker environment alignment and service health targeting.

### Documentation

- Updated role matrix and capability boundaries in `README.md`, `docs/api.md`, and `docs/architecture.md`.

[Unreleased]: https://github.com/Zburgers/obsidian-ledger/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Zburgers/obsidian-ledger/compare/v0.1.0...v0.2.0
