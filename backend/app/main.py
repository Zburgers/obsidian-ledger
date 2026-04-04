from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from slowapi.errors import RateLimitExceeded

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.records import router as records_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.export import router as export_router
from app.core.config import settings
from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from app.core.errors import validation_exception_handler, http_exception_handler

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
    return {"status": "ok"}


app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(records_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(export_router, prefix="/api/v1")
