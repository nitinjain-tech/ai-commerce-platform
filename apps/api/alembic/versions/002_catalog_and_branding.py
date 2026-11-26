"""Catalog domain and store branding

Revision ID: 002_catalog_and_branding
Revises: 001_initial_foundation
Create Date: 2026-11-13 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_catalog_and_branding"
down_revision: Union[str, None] = "001_initial_foundation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    # 1. Update tenants table with branding and configuration
    op.add_column("tenants", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("tenants", sa.Column("currency", sa.String(3), nullable=False, server_default="USD"))
    op.add_column("tenants", sa.Column("logo_url", sa.String(500), nullable=True))
    op.add_column(
        "tenants",
        sa.Column("settings", postgresql.JSONB() if is_postgres else sa.JSON(), nullable=True, server_default="{}"),
    )

    # 2. Categories table
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(500), nullable=True),
        sa.Column("parent_id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("tenant_id", "slug", name="uq_category_tenant_slug"),
    )
    op.create_index("ix_categories_tenant_id", "categories", ["tenant_id"])
    op.create_index("ix_categories_tenant_slug", "categories", ["tenant_id", "slug"])

    # 3. Products table
    op.create_table(
        "products",
        sa.Column("id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category_id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), sa.ForeignKey("categories.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(128), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("base_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("compare_at_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("tenant_id", "slug", name="uq_product_tenant_slug"),
    )
    op.create_index("ix_products_tenant_id", "products", ["tenant_id"])
    op.create_index("ix_products_tenant_slug", "products", ["tenant_id", "slug"])
    op.create_index("ix_products_tenant_category", "products", ["tenant_id", "category_id"])
    op.create_index("ix_products_tenant_featured", "products", ["tenant_id", "is_featured"])

    # 4. Product Variants table
    op.create_table(
        "product_variants",
        sa.Column("id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sku", sa.String(64), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=True),
        sa.Column("inventory_quantity", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("tenant_id", "sku", name="uq_variant_tenant_sku"),
    )
    op.create_index("ix_product_variants_tenant_id", "product_variants", ["tenant_id"])
    op.create_index("ix_product_variants_tenant_product", "product_variants", ["tenant_id", "product_id"])

    # 5. Product Images table
    op.create_table(
        "product_images",
        sa.Column("id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), primary_key=True),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True) if is_postgres else sa.String(36), sa.ForeignKey("products.id", ondelete="CASCADE"), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("alt_text", sa.String(255), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_thumbnail", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_product_images_tenant_id", "product_images", ["tenant_id"])
    op.create_index("ix_product_images_tenant_product", "product_images", ["tenant_id", "product_id"])

    # 6. Apply Row-Level Security on all tenant tables
    if is_postgres:
        tables = ["categories", "products", "product_variants", "product_images"]
        for table in tables:
            op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY;")
            op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY;")
            op.execute(f"""
                CREATE POLICY tenant_isolation_policy ON {table}
                FOR ALL
                USING (
                    current_setting('app.is_platform_admin', true) = 'true'
                    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                )
                WITH CHECK (
                    current_setting('app.is_platform_admin', true) = 'true'
                    OR tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
                );
            """)


def downgrade() -> None:
    bind = op.get_bind()
    is_postgres = bind.dialect.name == "postgresql"

    tables = ["product_images", "product_variants", "products", "categories"]
    if is_postgres:
        for table in tables:
            op.execute(f"DROP POLICY IF EXISTS tenant_isolation_policy ON {table};")

    for table in tables:
        op.drop_table(table)

    op.drop_column("tenants", "settings")
    op.drop_column("tenants", "logo_url")
    op.drop_column("tenants", "currency")
    op.drop_column("tenants", "description")
