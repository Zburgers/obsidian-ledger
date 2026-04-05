from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


def _extract_request_id(request: Request) -> str | None:
    return request.headers.get("x-request-id")


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = _extract_request_id(request)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "code": "validation_error",
            "errors": exc.errors(),
            "request_id": request_id,
        },
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    request_id = _extract_request_id(request)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "code": f"http_{exc.status_code}",
            "request_id": request_id,
        },
    )
