# ADR 002: Transaction-Local RLS Setting via `SET LOCAL`

## Status
Accepted

## Context
When using connection pooling (such as SQLAlchemy with `asyncpg`), database connections are reused across requests. If a request sets session state using `SET app.current_tenant_id = '...'`:
- If an exception occurs or the connection is returned to the pool without being properly reset (`DISCARD ALL` or `RESET ALL`), the next request utilizing that pooled connection could inadvertently run with the prior tenant's credentials.

## Decision
All tenant context injection must use:
```sql
SET LOCAL app.current_tenant_id = :tenant_id;
SET LOCAL app.is_platform_admin = :is_platform_admin;
```
within an explicit transaction block (`BEGIN ... COMMIT / ROLLBACK`).

`SET LOCAL` binds configuration parameters strictly to the current transaction. Once the transaction completes (commit or abort), PostgreSQL automatically discards the parameters.

## Consequences
- Guaranteed zero tenant contamination across connection reuse.
- All tenant-scoped operations must occur within a transaction block.
