# Database Architecture & Row-Level Security (RLS)

## 1. Database Model Overview

The database uses a **single shared schema** with Row-Level Security (RLS) in PostgreSQL. This architecture provides high operational simplicity, easy unified migrations, and optimal resource utilization, while preserving strict security boundaries.

### Core Tables (Foundation Phase)

- **`tenants`**: Store/tenant accounts, slugs, domains, status.
- **`users`**: Global identity records (email, password hash, platform admin flag). Users exist once globally.
- **`memberships`**: Links a global `user` to a specific `tenant` with a `role` (`customer`, `store_admin`, `store_staff`).
- **`refresh_tokens`**: Stores hashed refresh tokens with client metadata, expiry timestamps, and revocation flags for strict rotation.
- **`audit_logs`**: Immutable security and administrative mutation logs.
- **`background_jobs`**: Durable database-backed job queue for background tasks.

## 2. Row-Level Security Rules

All tenant-owned tables (such as future `products`, `orders`, `customers`, and tenant-specific settings) include:
1. A foreign key `tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE`.
2. An index on `tenant_id`.
3. `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;`
4. `ALTER TABLE <table_name> FORCE ROW LEVEL SECURITY;`
5. A row-level security policy:

```sql
CREATE POLICY tenant_isolation_policy ON <table_name>
FOR ALL
USING (
    current_setting('app.is_platform_admin', true) = 'true'
    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
)
WITH CHECK (
    current_setting('app.is_platform_admin', true) = 'true'
    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
);
```

## 3. Database Roles & Separation of Privileges

1. **`commerce_admin` (Migration User)**:
   - DDL privileges to create/alter tables and policies.
   - Used only by Alembic migration scripts.
2. **`commerce_app` (Runtime API User)**:
   - DML privileges only (SELECT, INSERT, UPDATE, DELETE).
   - Non-superuser, non-table-owner.
   - RLS cannot be bypassed by this role.
