from typing import Any, Dict, Optional

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import logger


class AppException(Exception):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_type: str = "about:blank"
    title: str = "Internal Server Error"
    detail: str = "An unexpected error occurred."
    extra: Optional[Dict[str, Any]] = None

    def __init__(
        self,
        detail: Optional[str] = None,
        title: Optional[str] = None,
        status_code: Optional[int] = None,
        extra: Optional[Dict[str, Any]] = None,
    ):
        if detail:
            self.detail = detail
        if title:
            self.title = title
        if status_code:
            self.status_code = status_code
        self.extra = extra or {}
        super().__init__(self.detail)


class NotFoundError(AppException):
    status_code = status.HTTP_404_NOT_FOUND
    title = "Resource Not Found"
    detail = "The requested resource was not found."


class UnauthorizedError(AppException):
    status_code = status.HTTP_401_UNAUTHORIZED
    title = "Unauthorized"
    detail = "Authentication is required to access this resource."


class ForbiddenError(AppException):
    status_code = status.HTTP_403_FORBIDDEN
    title = "Forbidden"
    detail = "You do not have permission to perform this action."


class ConflictError(AppException):
    status_code = status.HTTP_409_CONFLICT
    title = "Resource Conflict"
    detail = "The operation could not be completed due to a conflict."


class BadRequestError(AppException):
    status_code = status.HTTP_400_BAD_REQUEST
    title = "Bad Request"
    detail = "The request was invalid."


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        log_msg = f"AppException: {exc.title} ({exc.status_code}) on {request.method} {request.url.path}: {exc.detail}"
        if exc.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_404_NOT_FOUND):
            logger.info(log_msg)
        else:
            logger.warning(log_msg)
        content = {
            "type": exc.error_type,
            "title": exc.title,
            "status": exc.status_code,
            "detail": exc.detail,
            "instance": str(request.url.path),
            **exc.extra,
        }
        return JSONResponse(status_code=exc.status_code, content=content)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        logger.warning(f"Validation error on {request.method} {request.url.path}: {exc.errors()}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "type": "https://errors.commerce.local/validation-error",
                "title": "Validation Error",
                "status": status.HTTP_422_UNPROCESSABLE_ENTITY,
                "detail": "Request body or query parameters failed validation.",
                "instance": str(request.url.path),
                "errors": exc.errors(),
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "type": "about:blank",
                "title": exc.detail if isinstance(exc.detail, str) else "HTTP Error",
                "status": exc.status_code,
                "detail": str(exc.detail),
                "instance": str(request.url.path),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "type": "about:blank",
                "title": "Internal Server Error",
                "status": status.HTTP_500_INTERNAL_SERVER_ERROR,
                "detail": "An internal server error occurred.",
                "instance": str(request.url.path),
            },
        )
