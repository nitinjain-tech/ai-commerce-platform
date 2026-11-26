import uuid
from typing import List, Optional

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ConflictError, NotFoundError
from app.db.rls import set_tenant_rls_context
from app.domains.catalog.models import Category, Product, ProductImage, ProductVariant
from app.domains.catalog.schemas import (
    CategoryCreate,
    CategoryUpdate,
    ProductCreate,
    ProductImageCreate,
    ProductListItem,
    ProductUpdate,
    ProductVariantCreate,
)


class CatalogService:
    # -----------------------------------------------------------------
    # Categories
    # -----------------------------------------------------------------
    @staticmethod
    async def list_categories(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        active_only: bool = True,
    ) -> List[Category]:
        await set_tenant_rls_context(session, tenant_id=tenant_id)
        stmt = (
            select(Category)
            .where(Category.tenant_id == tenant_id)
            .order_by(Category.sort_order, Category.name)
        )
        if active_only:
            stmt = stmt.where(Category.is_active.is_(True))
        result = await session.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_category_by_id(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        category_id: uuid.UUID,
    ) -> Optional[Category]:
        await set_tenant_rls_context(session, tenant_id=tenant_id)
        stmt = select(Category).where(
            Category.tenant_id == tenant_id,
            Category.id == category_id,
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_category_by_slug(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        slug: str,
    ) -> Optional[Category]:
        await set_tenant_rls_context(session, tenant_id=tenant_id)
        stmt = select(Category).where(
            Category.tenant_id == tenant_id,
            Category.slug == slug,
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_category(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        data: CategoryCreate,
    ) -> Category:
        await set_tenant_rls_context(session, tenant_id=tenant_id)
        existing = await CatalogService.get_category_by_slug(session, tenant_id, data.slug)
        if existing:
            raise ConflictError(detail=f"Category with slug '{data.slug}' already exists in this store.")

        category = Category(
            tenant_id=tenant_id,
            name=data.name,
            slug=data.slug,
            description=data.description,
            image_url=data.image_url,
            parent_id=data.parent_id,
            is_active=data.is_active,
            sort_order=data.sort_order,
        )
        session.add(category)
        await session.flush()
        return category

    @staticmethod
    async def update_category(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        category_id: uuid.UUID,
        data: CategoryUpdate,
    ) -> Category:
        category = await CatalogService.get_category_by_id(session, tenant_id, category_id)
        if not category:
            raise NotFoundError(detail="Category not found.")

        if data.slug is not None and data.slug != category.slug:
            existing = await CatalogService.get_category_by_slug(session, tenant_id, data.slug)
            if existing and existing.id != category_id:
                raise ConflictError(detail=f"Category with slug '{data.slug}' already exists.")
            category.slug = data.slug

        if data.name is not None:
            category.name = data.name
        if data.description is not None:
            category.description = data.description
        if data.image_url is not None:
            category.image_url = data.image_url
        if data.parent_id is not None:
            category.parent_id = data.parent_id
        if data.is_active is not None:
            category.is_active = data.is_active
        if data.sort_order is not None:
            category.sort_order = data.sort_order

        await session.flush()
        return category

    @staticmethod
    async def delete_category(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        category_id: uuid.UUID,
    ) -> None:
        category = await CatalogService.get_category_by_id(session, tenant_id, category_id)
        if not category:
            raise NotFoundError(detail="Category not found.")
        await session.delete(category)
        await session.flush()

    # -----------------------------------------------------------------
    # Products
    # -----------------------------------------------------------------
    @staticmethod
    async def list_products(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        category_id: Optional[uuid.UUID] = None,
        category_slug: Optional[str] = None,
        is_featured: Optional[bool] = None,
        search: Optional[str] = None,
        active_only: bool = True,
        skip: int = 0,
        limit: int = 50,
    ) -> List[ProductListItem]:
        await set_tenant_rls_context(session, tenant_id=tenant_id)
        stmt = (
            select(Product)
            .where(Product.tenant_id == tenant_id)
            .order_by(Product.created_at.desc())
        )

        if active_only:
            stmt = stmt.where(Product.is_active.is_(True))

        if category_id:
            stmt = stmt.where(Product.category_id == category_id)

        if category_slug:
            stmt = stmt.join(Product.category).where(Category.slug == category_slug)

        if is_featured is not None:
            stmt = stmt.where(Product.is_featured == is_featured)

        if search:
            search_term = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Product.name.ilike(search_term),
                    Product.description.ilike(search_term),
                )
            )

        stmt = stmt.offset(skip).limit(limit)
        result = await session.execute(stmt)
        products = list(result.scalars().all())

        items = []
        for p in products:
            # Thumbnail extraction
            thumb = next((img.url for img in p.images if img.is_thumbnail), None)
            if not thumb and p.images:
                thumb = p.images[0].url

            total_inv = sum(v.inventory_quantity for v in p.variants) if p.variants else 0

            items.append(
                ProductListItem(
                    id=p.id,
                    name=p.name,
                    slug=p.slug,
                    description=p.description,
                    basePrice=p.base_price,
                    compareAtPrice=p.compare_at_price,
                    currency=p.currency,
                    categoryId=p.category_id,
                    categoryName=p.category.name if p.category else None,
                    isActive=p.is_active,
                    isFeatured=p.is_featured,
                    thumbnailUrl=thumb,
                    totalInventory=total_inv,
                )
            )
        return items

    @staticmethod
    async def get_product_by_id(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        product_id: uuid.UUID,
    ) -> Optional[Product]:
        await set_tenant_rls_context(session, tenant_id=tenant_id)
        stmt = select(Product).where(
            Product.tenant_id == tenant_id,
            Product.id == product_id,
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_product_by_slug(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        slug: str,
    ) -> Optional[Product]:
        await set_tenant_rls_context(session, tenant_id=tenant_id)
        stmt = select(Product).where(
            Product.tenant_id == tenant_id,
            Product.slug == slug,
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_product(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        data: ProductCreate,
    ) -> Product:
        await set_tenant_rls_context(session, tenant_id=tenant_id)
        existing = await CatalogService.get_product_by_slug(session, tenant_id, data.slug)
        if existing:
            raise ConflictError(detail=f"Product with slug '{data.slug}' already exists in this store.")

        product = Product(
            tenant_id=tenant_id,
            category_id=data.category_id,
            name=data.name,
            slug=data.slug,
            description=data.description,
            base_price=data.base_price,
            compare_at_price=data.compare_at_price,
            currency=data.currency,
            is_active=data.is_active,
            is_featured=data.is_featured,
        )
        session.add(product)
        await session.flush()

        # Add initial variants if provided
        for v in data.variants:
            variant = ProductVariant(
                tenant_id=tenant_id,
                product_id=product.id,
                sku=v.sku,
                name=v.name,
                price=v.price or data.base_price,
                inventory_quantity=v.inventory_quantity,
                is_active=v.is_active,
            )
            session.add(variant)

        # Add initial images if provided
        for img in data.images:
            image = ProductImage(
                tenant_id=tenant_id,
                product_id=product.id,
                url=img.url,
                alt_text=img.alt_text,
                sort_order=img.sort_order,
                is_thumbnail=img.is_thumbnail,
            )
            session.add(image)

        await session.flush()
        # Refresh product to eagerly load relations
        return await CatalogService.get_product_by_id(session, tenant_id, product.id)

    @staticmethod
    async def update_product(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        product_id: uuid.UUID,
        data: ProductUpdate,
    ) -> Product:
        product = await CatalogService.get_product_by_id(session, tenant_id, product_id)
        if not product:
            raise NotFoundError(detail="Product not found.")

        if data.slug is not None and data.slug != product.slug:
            existing = await CatalogService.get_product_by_slug(session, tenant_id, data.slug)
            if existing and existing.id != product_id:
                raise ConflictError(detail=f"Product with slug '{data.slug}' already exists.")
            product.slug = data.slug

        if data.name is not None:
            product.name = data.name
        if data.description is not None:
            product.description = data.description
        if data.base_price is not None:
            product.base_price = data.base_price
        if data.compare_at_price is not None:
            product.compare_at_price = data.compare_at_price
        if data.currency is not None:
            product.currency = data.currency
        if data.category_id is not None:
            product.category_id = data.category_id
        if data.is_active is not None:
            product.is_active = data.is_active
        if data.is_featured is not None:
            product.is_featured = data.is_featured

        await session.flush()
        return await CatalogService.get_product_by_id(session, tenant_id, product.id)

    @staticmethod
    async def delete_product(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        product_id: uuid.UUID,
    ) -> None:
        product = await CatalogService.get_product_by_id(session, tenant_id, product_id)
        if not product:
            raise NotFoundError(detail="Product not found.")
        await session.delete(product)
        await session.flush()

    @staticmethod
    async def add_variant(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        product_id: uuid.UUID,
        data: ProductVariantCreate,
    ) -> ProductVariant:
        await set_tenant_rls_context(session, tenant_id=tenant_id)
        product = await CatalogService.get_product_by_id(session, tenant_id, product_id)
        if not product:
            raise NotFoundError(detail="Product not found.")

        variant = ProductVariant(
            tenant_id=tenant_id,
            product_id=product.id,
            sku=data.sku,
            name=data.name,
            price=data.price or product.base_price,
            inventory_quantity=data.inventory_quantity,
            is_active=data.is_active,
        )
        session.add(variant)
        await session.flush()
        return variant

    @staticmethod
    async def add_image(
        session: AsyncSession,
        tenant_id: uuid.UUID,
        product_id: uuid.UUID,
        data: ProductImageCreate,
    ) -> ProductImage:
        await set_tenant_rls_context(session, tenant_id=tenant_id)
        product = await CatalogService.get_product_by_id(session, tenant_id, product_id)
        if not product:
            raise NotFoundError(detail="Product not found.")

        image = ProductImage(
            tenant_id=tenant_id,
            product_id=product.id,
            url=data.url,
            alt_text=data.alt_text,
            sort_order=data.sort_order,
            is_thumbnail=data.is_thumbnail,
        )
        session.add(image)
        await session.flush()
        return image
