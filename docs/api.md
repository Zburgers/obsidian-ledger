# API Documentation

Base URL: `http://localhost:8000/api/v1`

Interactive docs: `http://localhost:8000/docs`
OpenAPI JSON: `http://localhost:8000/openapi.json`

## Authentication

All endpoints except `/auth/register`, `/auth/login`, and `/auth/refresh` require a Bearer token.

```
Authorization: Bearer <access_token>
```

### Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass1!",
  "name": "John Doe"
}
```

Response `201`:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "viewer",
  "is_active": true
}
```

Password requirements: min 8 chars, uppercase, lowercase, digit.

### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass1!"
}
```

Response `200`:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

### Refresh

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJ..."
}
```

### Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

## Users (Admin Only)

### List Users

```http
GET /api/v1/users?page=1&page_size=20
Authorization: Bearer <admin_token>
```

### Create User

```http
POST /api/v1/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass1!",
  "name": "New User",
  "role": "analyst"
}
```

### Update User

```http
PATCH /api/v1/users/{user_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "role": "admin",
  "is_active": true
}
```

### Delete User (Soft)

```http
DELETE /api/v1/users/{user_id}
Authorization: Bearer <admin_token>
```

Response `204`.

## Records

### List Records

```http
GET /api/v1/records?page=1&page_size=20&type=expense&category=Food&date_from=2025-01-01&date_to=2025-12-31
Authorization: Bearer <token>
```

All authenticated roles can list records in paginated read-only form.

Basic filters (`type`, `category`, `date_from`, `date_to`) are available to Viewer, Analyst, and Admin.

Advanced filters (`search`, `amount_min`, `amount_max`) require Analyst or Admin role.

Example (Analyst/Admin only):

```http
GET /api/v1/records?page=1&page_size=20&search=groceries&amount_min=50&amount_max=1000
Authorization: Bearer <analyst_or_admin_token>
```

### Create Record (Admin Only)

```http
POST /api/v1/records
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "record_type": "expense",
  "category": "Food",
  "amount": "25.50",
  "description": "Lunch",
  "recorded_at": "2025-01-15T12:00:00Z"
}
```

### Get Record

```http
GET /api/v1/records/{record_id}
Authorization: Bearer <token>
```

### Update Record (Admin Only)

```http
PATCH /api/v1/records/{record_id}
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "category": "Groceries",
  "amount": "30.00"
}
```

### Delete Record (Admin Only)

```http
DELETE /api/v1/records/{record_id}
Authorization: Bearer <admin_token>
```

## Dashboard

### Summary

```http
GET /api/v1/dashboard/summary
Authorization: Bearer <token>
```

Response:
```json
{
  "total_income": "5000.00",
  "total_expense": "200.00",
  "net": "4800.00",
  "record_count": 3
}
```

### By Category

```http
GET /api/v1/dashboard/by-category
Authorization: Bearer <analyst_or_admin_token>
```

Requires Analyst or Admin role.

### Trends

```http
GET /api/v1/dashboard/trends?months=6
Authorization: Bearer <analyst_or_admin_token>
```

Requires Analyst or Admin role.

### Monthly Comparison

```http
GET /api/v1/dashboard/comparison?period_a=2026-01&period_b=2026-02
Authorization: Bearer <analyst_or_admin_token>
```

Requires Analyst or Admin role.

Response:

```json
{
  "period_a": "2026-01",
  "period_b": "2026-02",
  "totals_a": { "income": "1000.00", "expense": "400.00", "net": "600.00" },
  "totals_b": { "income": "1300.00", "expense": "450.00", "net": "850.00" },
  "income_delta": "300.00",
  "expense_delta": "50.00",
  "net_delta": "250.00"
}
```

### Recent

```http
GET /api/v1/dashboard/recent?limit=10
Authorization: Bearer <token>
```

## Export

### CSV Export

```http
GET /api/v1/export/csv
Authorization: Bearer <token>
```

Returns `text/csv` file download.

### PDF Export

```http
GET /api/v1/export/pdf
Authorization: Bearer <token>
```

Returns `application/pdf` report.

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message",
  "code": "error_code"
}
```

| Status | Code | Description |
|--------|------|-------------|
| 400 | `http_400` | Bad request |
| 401 | `http_401` | Invalid/missing token |
| 403 | `http_403` | Insufficient permissions |
| 404 | `http_404` | Resource not found |
| 422 | `validation_error` | Validation error |
| 429 | `rate_limit_exceeded` | Rate limit exceeded |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5/minute |
| `/auth/register` | 10/minute |
| `/auth/refresh` | 10/minute |
| All others | 60/minute |
