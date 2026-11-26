# ADR 001: Shared Schema Multi-Tenancy with PostgreSQL Row-Level Security (RLS)

## Status
Accepted

## Context
A multi-tenant SaaS platform can be structured using:
1. **Database-per-tenant**: Extreme isolation, but high operational overhead, difficult cross-tenant analytics, complex migrations across hundreds of databases.
2. **Schema-per-tenant**: Moderate isolation, but connection pool exhaustion, schema drift risks, high migration runtime.
3. **Shared schema with application-level filtering**: Simple, but high risk of data leaks if a developer omits a `WHERE tenant_id = ...` clause.
4. **Shared schema with PostgreSQL Row-Level Security (RLS)**: Strong database-enforced isolation, centralized migrations, cost-efficient resource utilization.

## Decision
We adopt **Shared Schema with PostgreSQL Row-Level Security (RLS)** combined with application-level tenant context injection.

Key requirements:
1. Every tenant-owned table must include `tenant_id UUID NOT NULL`.
2. Tables enforce RLS with `FORCE ROW LEVEL SECURITY`.
3. The API connects using a non-superuser role `commerce_app`.
4. Platform admins can explicitly query across tenants using a checked session flag `app.is_platform_admin = 'true'`.

## Consequences
- **Positive**: Complete database-level guarantee against cross-tenant leaks. Single schema migrations via Alembic. Simple pooling.
- **Negative**: Requires setting session/transaction variables before querying tenant tables. Requires dedicated testing with non-superuser database connections.
