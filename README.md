# AI Commerce Platform

A production-oriented, multi-tenant commerce SaaS built as a modular monolith with Angular 18, FastAPI, and PostgreSQL with Row-Level Security (RLS).

## Architecture Overview

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2 (async), PostgreSQL Row-Level Security, Alembic.
- **Frontend**: Angular 18 (standalone components, signals, functional guards and interceptors).
- **Tenant Isolation**: 3-layer isolation (JWT membership authorization, query-level scoping, and PostgreSQL RLS).
- **Authentication**: JWT access tokens (stored strictly in memory) + HTTP-only, Secure refresh tokens with database tracking & rotation.

## Directory Structure

```
ai-commerce-platform/
├─ apps/
│  ├─ api/             # FastAPI backend application
│  │  ├─ app/
│  │  │  ├─ api/v1/     # REST route handlers
│  │  │  ├─ core/       # Settings, security, errors, logging
│  │  │  ├─ db/         # SQLAlchemy async engine, base, session, RLS helpers
│  │  │  ├─ auth/       # JWT tokens, password hashing, dependencies
│  │  │  ├─ tenants/    # Tenant resolution, context, membership verification
│  │  │  ├─ domains/    # Modular monolith domains (stores, catalog, cart, etc.)
│  │  │  ├─ jobs/       # Durable background job queue & execution
│  │  │  └─ storage/    # File storage interface (local / azure)
│  │  ├─ alembic/       # Database migrations
│  │  └─ tests/         # Unit, API, and Security/RLS isolation tests
│  └─ web/             # Angular 18 frontend
│     └─ src/app/
│        ├─ core/       # Auth/tenant services, guards, interceptors, models
│        ├─ shared/     # Reusable UI components, directives, status pages
│        ├─ storefront/ # Public storefront area
│        ├─ customer/   # Customer self-service portal
│        ├─ store-admin/# Store administration
│        └─ platform-admin/ # Platform super-admin cross-tenant area
├─ infra/              # Docker, Azure, and CI/CD configs
├─ docs/               # Architecture Decision Records (ADRs) & system guides
└─ docker-compose.yml  # Local development database
```

## Quick Start

### 1. Start the Database
```bash
docker compose up -d db
```

### 2. Run the Backend API
```bash
cd apps/api
# Create and activate virtualenv
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Apply database migrations
alembic upgrade head

# Start API server
uvicorn app.main:app --reload --port 8000
```
Open API documentation at: `http://localhost:8000/docs`

### 3. Run the Frontend
```bash
cd apps/web
npm install
npm start
```
Open storefront at: `http://localhost:4200`
