# AI Commerce Platform — Full-Stack Project Context

> Scope of this document: the **full-stack commerce application only** (Angular + FastAPI + PostgreSQL). AI/ML capabilities are intentionally out of scope for now and will be layered on after the core platform is stable.

**Local path:** `F:\LEARNING---CAREER\AI_ML\ai-commerce-platform`

---

## 1. What this is

A production-oriented, **multi-tenant commerce SaaS** built as a **modular monolith**. Multiple stores run on one platform; each store has its own public storefront, customers, and admin area, and a platform-level super admin oversees all tenants.

The first milestone establishes the security and operational foundation. Catalogue, cart, checkout, orders, and the rest follow incrementally.

## 2. Tech stack

| Layer | Technology |
|---|---|
| Frontend | Angular 18 (standalone components, signals, functional guards/interceptors), TypeScript |
| Backend | Python 3.11, FastAPI, Uvicorn |
| Database | PostgreSQL with Row-Level Security (RLS) |
| Migrations | Alembic |
| Auth | JWT access tokens + refresh tokens, RBAC |
| Local infra | Docker Compose (PostgreSQL) |
| Cloud target | Azure (`infra/azure`), GitHub Actions CI/CD |
| Testing | pytest (unit / integration / api / security), ruff for linting |

## 3. Core principles

1. **Tenant isolation is enforced in three layers:** request authorization, service/repository scope, and PostgreSQL RLS.
2. **One global identity, many memberships.** A user can hold separate memberships (and roles) on multiple stores. Store-scoped customer data stays isolated.
3. **Public tenant identity comes from the configured store domain**, never from a caller-supplied tenant ID.
4. **The API is the only authorization boundary.** Frontend guards and directives are UX only.
5. **Add domain tables only with their feature.** No speculative schema.

## 4. Roles

| Role | Scope | Frontend area |
|---|---|---|
| anonymous | Public | Storefront (`/`) |
| `customer` | Per store | Customer portal (`/account`) |
| `store_admin` | Per store | Store admin (`/admin/:storeSlug`) |
| `platform_admin` | Cross-tenant | Platform admin (`/platform`) |

## 5. Repository structure

```
ai-commerce-platform/
├─ apps/
│  ├─ api/
│  │  ├─ app/
│  │  │  ├─ api/v1/            # route handlers
│  │  │  ├─ core/              # settings, security, logging, errors
│  │  │  ├─ db/                # engine, models, migration helpers
│  │  │  ├─ auth/              # JWT, password hashing, RBAC
│  │  │  ├─ tenants/           # resolution, membership, RLS context
│  │  │  ├─ domains/
│  │  │  │  ├─ stores/  catalog/  cart/  orders/
│  │  │  │  └─ customers/  documents/  analytics/  reviews/
│  │  │  ├─ storage/
│  │  │  ├─ jobs/              # durable background jobs
│  │  │  └─ observability/
│  │  ├─ alembic/
│  │  └─ tests/ (unit, integration, api, security)
│  └─ web/
│     └─ src/app/
│        ├─ core/              # auth/tenant services, guards, interceptors, models
│        ├─ shared/            # reusable components, directives, status pages
│        ├─ storefront/        # public
│        ├─ customer/
│        ├─ store-admin/
│        └─ platform-admin/
├─ infra/ (docker, azure, github-actions)
├─ docs/ (adr, architecture, api, deployment, security)
├─ docker-compose.yml
├─ README.md
└─ .env.example
```

## 6. Backend

### Current scope (initial migration)
- Tenancy, identities, memberships, refresh tokens, audit logs, durable background jobs.
- PostgreSQL RLS policy function used by every tenant-owned table.
- Health endpoint: `GET /health`; OpenAPI at `/docs`.

### Conventions
- Migrations run with the **migration-only DB URL**; the API runs as a **non-superuser runtime role** (so RLS actually applies).
- Every tenant-owned table gets an RLS policy from the shared policy function.
- Services and repositories always take the authenticated tenant context.
- Read `docs/architecture/overview.md`, `docs/architecture/database.md`, and `docs/adr/001-shared-schema-rls.md` before extending the data model.

### Local setup
1. Copy `.env.example` to `.env`; replace the JWT secret.
2. Create/activate a Python 3.11 venv.
3. `python -m pip install -e ".[dev]"`
4. `docker compose up -d db`
5. From `apps/api`: `alembic upgrade head`
6. `uvicorn app.main:app --app-dir apps/api --reload`
7. Checks: `pytest` and `ruff check apps/api`

RLS integration test: apply migrations to an isolated test DB, set its non-superuser connection string as `TEST_DATABASE_URL`, then `pytest -m integration`.

## 7. Frontend (Angular 18)

### State: scaffold complete
- Standalone architecture, `bootstrapApplication`, provider wiring in `app.config.ts`.
- Four **lazy-loaded** route trees in `app.routes.ts`, so anonymous visitors never download admin bundles.
- Each area has a layout shell and a placeholder page; storefront also has a working login form (reactive forms, `returnUrl` support) and a register placeholder.

### Routing and guards

| Guard | Purpose |
|---|---|
| `authGuard` | Redirects to `/login?returnUrl=…` when not signed in |
| `roleGuard(...roles)` | Requires a role; if the route has `:storeSlug`, checks membership on **that store** |
| `guestGuard` | Keeps signed-in users off `/login` and `/register` |

Guards compose on each area's parent route, so children inherit them.

### Auth model
- `AuthService`: signal-based current user + memberships; `hasRole`, `hasRoleOnStore`.
- `TokenStorageService`: access token **in memory only** (never `localStorage`/`sessionStorage`).
- Refresh token: **httpOnly, Secure cookie** set by the API; the browser sends it automatically.
- `authInterceptor`: attaches the bearer token; on 401 does one silent refresh and retry.
- `errorInterceptor`: unresolved 401 → `/login`; 403 → `/forbidden`.
- `TenantContextService`: presentation-only store context (branding, labels). **Not** a security boundary.

### Reusable pieces
`LoadingSpinnerComponent`, `EmptyStateComponent`, `ConfirmDialogComponent`, `PageHeaderComponent`, `HasRoleDirective` (`*appHasRole="'store_admin'"`), plus `ForbiddenComponent` and `NotFoundComponent`.

### API contract the frontend currently assumes
- `POST /api/v1/auth/login` → `{ accessToken, expiresInSeconds, user }`
- `POST /api/v1/auth/refresh` (cookie-based) → same shape
- `POST /api/v1/auth/logout`

`user` carries `id`, `email`, `displayName`, and `memberships[] { storeId, storeSlug, role }`.

### Run locally
```bash
cd apps/web
npm install
npm start        # http://localhost:4200
```

## 8. Security checklist (keep true as features land)

- [ ] Every new tenant table has an RLS policy and an isolation test in `tests/security`.
- [ ] No endpoint accepts a tenant ID from the client for authorization.
- [ ] Role checks exist server-side for every protected route (frontend guards are not enough).
- [ ] Access tokens stay out of persistent browser storage.
- [ ] Refresh tokens remain httpOnly cookies; rotation and revocation are covered by tests.
- [ ] Audit log entries written for admin-level mutations.

## 9. Roadmap (full-stack only)

**Phase 1 — Foundation (done):** tenancy, identity, memberships, refresh tokens, audit logs, background jobs, RLS; Angular scaffold with guarded areas.

**Phase 2 — Auth and tenancy end-to-end**
- Implement `/auth/login`, `/auth/refresh`, `/auth/logout`, register.
- Store domain → tenant resolution middleware.
- Dev proxy from Angular to the API (CORS/cookies).
- App-bootstrap session restore via refresh.

**Phase 3 — Stores and catalogue**
- Stores domain (create/configure, domains, branding).
- Catalog: categories, products, variants, inventory, images (storage layer).
- Storefront: product list and detail pages.
- Store admin: product management screens.

**Phase 4 — Cart, checkout, orders**
- Cart (guest and customer), checkout, payments integration.
- Orders domain, customer order history, store admin order management.

**Phase 5 — Customers, reviews, documents**
- Customer profile/addresses, reviews and moderation, documents (invoices, exports).

**Phase 6 — Analytics and platform admin**
- Store dashboards, platform-wide metrics, tenant management screens.

**Phase 7 — Hardening and deployment**
- CI/CD in GitHub Actions, Azure deployment, observability, load and security testing.

*Later (not in current scope):* AI/ML capabilities, built on top of the same authenticated tenant context.

## 10. Working agreements

- Prefer small, additive changes: new `loadComponent` entries in each area's `*.routes.ts`; new domain folders under `domains/`.
- New screens use the shared components before introducing new ones.
- Write an ADR in `docs/adr/` for any decision that changes tenancy, auth, or data-model rules.
