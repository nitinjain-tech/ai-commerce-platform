import os
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.errors import register_error_handlers
from app.core.logging import setup_logging
from app.observability.middleware import ObservabilityMiddleware
from app.tenants.middleware import TenantResolutionMiddleware

settings = get_settings()
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# 1. Error handlers
register_error_handlers(app)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Observability Middleware (correlation ID, logging, execution time)
app.add_middleware(ObservabilityMiddleware)

# 4. Tenant Resolution Middleware (host/domain to tenant context)
app.add_middleware(TenantResolutionMiddleware)


# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "environment": settings.ENVIRONMENT,
    }


# Static file serving for uploaded media assets
os.makedirs(settings.LOCAL_STORAGE_PATH, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.LOCAL_STORAGE_PATH), name="uploads")

# Mount API V1 routes
app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)
