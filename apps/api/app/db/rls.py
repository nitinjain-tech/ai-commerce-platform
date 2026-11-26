import uuid
from typing import Optional

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


def get_enable_rls_sql(table_name: str) -> str:
    """PostgreSQL DDL to enable and force Row-Level Security on a table."""
    return f"""
    ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
    ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY;
    """


def get_create_rls_policy_sql(table_name: str, policy_name: str = "tenant_isolation_policy") -> str:
    """
    DDL for the standard tenant isolation policy.
    Grants access if:
    1. app.is_platform_admin is set to 'true', OR
    2. tenant_id matches the session variable app.current_tenant_id.
    """
    return f"""
    DROP POLICY IF EXISTS {policy_name} ON {table_name};
    CREATE POLICY {policy_name} ON {table_name}
    FOR ALL
    USING (
        current_setting('app.is_platform_admin', true) = 'true'
        OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    )
    WITH CHECK (
        current_setting('app.is_platform_admin', true) = 'true'
        OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
    );
    """


def get_drop_rls_policy_sql(table_name: str, policy_name: str = "tenant_isolation_policy") -> str:
    return f"DROP POLICY IF EXISTS {policy_name} ON {table_name};"


async def set_tenant_rls_context(
    session: AsyncSession,
    tenant_id: Optional[uuid.UUID] = None,
    is_platform_admin: bool = False,
) -> None:
    """
    Injects tenant context into the PostgreSQL session transaction using SET LOCAL.
    Safe with connection pooling because SET LOCAL scope ends with transaction commit/rollback.
    Skips execution if dialect is not postgresql (e.g. SQLite test engine).
    """
    bind = session.bind
    if bind and "postgresql" not in bind.dialect.name:
        return

    # Set platform admin bypass flag
    admin_flag = "true" if is_platform_admin else "false"
    await session.execute(
        text("SELECT set_config('app.is_platform_admin', :admin_val, true)"),
        {"admin_val": admin_flag},
    )

    # Set current tenant id
    tenant_str = str(tenant_id) if tenant_id else ""
    await session.execute(
        text("SELECT set_config('app.current_tenant_id', :tenant_str, true)"),
        {"tenant_str": tenant_str},
    )
