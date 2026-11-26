import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.jobs.models import BackgroundJob


class JobService:
    @staticmethod
    async def enqueue_job(
        session: AsyncSession,
        task_name: str,
        payload: Dict[str, Any],
        tenant_id: Optional[uuid.UUID] = None,
        queue: str = "default",
        run_at: Optional[datetime] = None,
    ) -> BackgroundJob:
        job = BackgroundJob(
            task_name=task_name,
            payload=payload,
            tenant_id=tenant_id,
            queue=queue,
            run_at=run_at or datetime.now(timezone.utc),
            status="pending",
        )
        session.add(job)
        await session.flush()
        return job

    @staticmethod
    async def list_jobs(
        session: AsyncSession,
        queue: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
    ) -> List[BackgroundJob]:
        stmt = select(BackgroundJob).order_by(BackgroundJob.created_at.desc()).limit(limit)
        if queue:
            stmt = stmt.where(BackgroundJob.queue == queue)
        if status:
            stmt = stmt.where(BackgroundJob.status == status)

        result = await session.execute(stmt)
        return list(result.scalars().all())
