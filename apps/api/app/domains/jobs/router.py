import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_platform_admin
from app.db.session import get_db_session
from app.domains.auth.models import User
from app.domains.jobs.service import JobService

router = APIRouter(prefix="/jobs", tags=["Background Jobs"])


class JobRead(BaseModel):
    id: uuid.UUID
    queue: str
    tenant_id: Optional[uuid.UUID] = None
    task_name: str
    payload: Dict[str, Any]
    status: str
    attempts: int
    max_attempts: int
    run_at: datetime
    error_message: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("", response_model=List[JobRead])
async def list_jobs(
    queue: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(require_platform_admin),
    session: AsyncSession = Depends(get_db_session),
):
    return await JobService.list_jobs(session, queue=queue, status=status, limit=limit)
