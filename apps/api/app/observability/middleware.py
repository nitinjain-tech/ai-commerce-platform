import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import logger


class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
        request.state.request_id = request_id

        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = (time.perf_counter() - start_time) * 1000  # ms

        response.headers["x-request-id"] = request_id
        response.headers["x-process-time"] = f"{process_time:.2f}ms"

        # Log request summary
        logger.info(
            f"{request.method} {request.url.path} "
            f"-> status={response.status_code} duration={process_time:.2f}ms id={request_id}"
        )
        return response
