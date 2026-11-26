from fastapi import APIRouter

from app.domains.auth.router import router as auth_router
from app.domains.catalog.router import (
    admin_router as admin_catalog_router,
)
from app.domains.catalog.router import (
    router as catalog_router,
)
from app.domains.catalog.router import (
    storage_router,
)
from app.domains.jobs.router import router as jobs_router
from app.domains.tenants.router import router as tenants_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(tenants_router)
api_v1_router.include_router(jobs_router)
api_v1_router.include_router(catalog_router)
api_v1_router.include_router(admin_catalog_router)
api_v1_router.include_router(storage_router)
