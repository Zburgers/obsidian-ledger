import asyncio
import time
from datetime import datetime, timezone
from urllib.parse import urlparse

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text
from slowapi.errors import RateLimitExceeded

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.records import router as records_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.export import router as export_router
from app.core.config import settings
from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from app.core.errors import validation_exception_handler, http_exception_handler
from app.db.session import engine

app = FastAPI(
    title="FinTrack API",
    version="1.0.0",
    description="Finance tracking backend with authentication, record management, analytics, and export.",
    openapi_tags=[
        {"name": "auth", "description": "Authentication and user management"},
        {"name": "users", "description": "Admin user CRUD operations"},
        {"name": "records", "description": "Financial record CRUD and filtering"},
        {"name": "dashboard", "description": "Analytics and dashboard aggregations"},
        {"name": "export", "description": "Data export in CSV and text formats"},
    ],
)
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)


@app.get("/health")
async def health():
    started_at = time.perf_counter()

    database_url = settings.database_url
    parsed_db_url = urlparse(database_url)
    db_scheme = parsed_db_url.scheme
    db_host = parsed_db_url.hostname or (
        "local-file" if db_scheme.startswith("sqlite") else "unknown"
    )
    db_port = parsed_db_url.port
    db_name = (parsed_db_url.path or "").lstrip("/") or None

    database_status = "down"
    database_error = None
    database_latency_ms = None
    db_check_started_at = time.perf_counter()
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        database_status = "ok"
        database_latency_ms = round(
            (time.perf_counter() - db_check_started_at) * 1000, 2
        )
    except Exception as exc:  # pragma: no cover - exercised in deployment
        database_error = str(exc)

    frontend_target = (
        settings.cors_origins[0] if settings.cors_origins else "http://localhost:5173"
    )
    parsed_frontend_url = urlparse(frontend_target)
    frontend_host = parsed_frontend_url.hostname or "localhost"
    frontend_port = parsed_frontend_url.port or 5173

    frontend_status = "down"
    frontend_error = None
    frontend_latency_ms = None
    frontend_check_started_at = time.perf_counter()
    try:
        _reader, writer = await asyncio.wait_for(
            asyncio.open_connection(frontend_host, frontend_port),
            timeout=1.0,
        )
        writer.close()
        await writer.wait_closed()
        frontend_status = "ok"
        frontend_latency_ms = round(
            (time.perf_counter() - frontend_check_started_at) * 1000,
            2,
        )
    except Exception as exc:  # pragma: no cover - depends on runtime services
        frontend_error = str(exc)

    services = {
        "backend": {
            "status": "ok",
            "host": "0.0.0.0",
            "port": 8000,
            "details": "FastAPI service is running",
        },
        "database": {
            "status": database_status,
            "engine": db_scheme,
            "host": db_host,
            "port": db_port,
            "database": db_name,
            "latency_ms": database_latency_ms,
            "error": database_error,
        },
        "frontend": {
            "status": frontend_status,
            "host": frontend_host,
            "port": frontend_port,
            "url": frontend_target,
            "latency_ms": frontend_latency_ms,
            "error": frontend_error,
        },
    }

    overall_status = "ok"
    if any(service["status"] != "ok" for service in services.values()):
        overall_status = "degraded"

    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "response_time_ms": round((time.perf_counter() - started_at) * 1000, 2),
        "services": services,
    }


app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(records_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(export_router, prefix="/api/v1")
