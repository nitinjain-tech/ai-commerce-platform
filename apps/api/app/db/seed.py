import asyncio
import uuid
from decimal import Decimal

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import async_session_maker
from app.domains.auth.models import Membership, User
from app.domains.catalog.models import Category, Product, ProductImage, ProductVariant
from app.domains.tenants.models import Tenant


async def seed_database():
    print("🌱 Starting database seeding...")
    async with async_session_maker() as session:
        async with session.begin():
            # Enable platform admin bypass for global system seeding
            from app.db.rls import set_tenant_rls_context
            await set_tenant_rls_context(session, is_platform_admin=True)
            # 1. Platform Super Admin
            stmt = select(User).where(User.email == "superadmin@platform.local")
            admin = (await session.execute(stmt)).scalar_one_or_none()

            if not admin:
                admin = User(
                    id=uuid.uuid4(),
                    email="superadmin@platform.local",
                    password_hash=hash_password("SuperAdmin123!"),
                    display_name="Platform SuperAdmin",
                    is_active=True,
                    is_platform_admin=True,
                )
                session.add(admin)
                print("  ✓ Created SuperAdmin: superadmin@platform.local (Password: SuperAdmin123!)")
            else:
                print("  ℹ SuperAdmin already exists.")

            # 2. Demo Store 1: Apex Athletics
            stmt = select(Tenant).where(Tenant.slug == "apex-athletics")
            store1 = (await session.execute(stmt)).scalar_one_or_none()

            if not store1:
                store1 = Tenant(
                    id=uuid.uuid4(),
                    name="Apex Athletics",
                    slug="apex-athletics",
                    domain="apex.localhost",
                    is_active=True,
                )
                session.add(store1)
                await session.flush()
                print("  ✓ Created Demo Store: Apex Athletics (slug: apex-athletics)")
            else:
                print("  ℹ Store apex-athletics already exists.")

            # 3. Demo Store Admin for Store 1
            stmt = select(User).where(User.email == "storeadmin@apex.local")
            store_admin = (await session.execute(stmt)).scalar_one_or_none()

            if not store_admin:
                store_admin = User(
                    id=uuid.uuid4(),
                    email="storeadmin@apex.local",
                    password_hash=hash_password("StoreAdmin123!"),
                    display_name="Apex Store Admin",
                    is_active=True,
                    is_platform_admin=False,
                )
                session.add(store_admin)
                await session.flush()

                membership = Membership(
                    id=uuid.uuid4(),
                    user_id=store_admin.id,
                    tenant_id=store1.id,
                    role="store_admin",
                    is_active=True,
                )
                session.add(membership)
                print("  ✓ Created Store Admin: storeadmin@apex.local (Password: StoreAdmin123!)")
            else:
                print("  ℹ Store admin already exists.")

            # 4. Demo Customer for Store 1
            stmt = select(User).where(User.email == "customer@apex.local")
            customer = (await session.execute(stmt)).scalar_one_or_none()

            if not customer:
                customer = User(
                    id=uuid.uuid4(),
                    email="customer@apex.local",
                    password_hash=hash_password("Customer123!"),
                    display_name="Alice Customer",
                    is_active=True,
                    is_platform_admin=False,
                )
                session.add(customer)
                await session.flush()

                membership = Membership(
                    id=uuid.uuid4(),
                    user_id=customer.id,
                    tenant_id=store1.id,
                    role="customer",
                    is_active=True,
                )
                session.add(membership)
                print("  ✓ Created Customer: customer@apex.local (Password: Customer123!)")
            else:
                print("  ℹ Customer already exists.")

            # 5. Seed Catalog Categories for Apex Athletics
            print("  📦 Seeding Catalog for Apex Athletics...")
            store1.description = "Premium performance apparel, running footwear, and athletic gear built for elite athletes."
            store1.currency = "USD"
            store1.logo_url = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop"

            categories_data = [
                {"name": "Footwear", "slug": "footwear", "desc": "High-performance running & training shoes", "order": 1, "img": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop"},
                {"name": "Apparel", "slug": "apparel", "desc": "Breathable technical tees, shorts, and layers", "order": 2, "img": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop"},
                {"name": "Accessories", "slug": "accessories", "desc": "Hydration gear, gym bags, and headwear", "order": 3, "img": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop"},
            ]

            category_map = {}
            for c_info in categories_data:
                stmt = select(Category).where(Category.tenant_id == store1.id, Category.slug == c_info["slug"])
                cat = (await session.execute(stmt)).scalar_one_or_none()
                if not cat:
                    cat = Category(
                        id=uuid.uuid4(),
                        tenant_id=store1.id,
                        name=c_info["name"],
                        slug=c_info["slug"],
                        description=c_info["desc"],
                        image_url=c_info["img"],
                        sort_order=c_info["order"],
                        is_active=True,
                    )
                    session.add(cat)
                    await session.flush()
                    print(f"    ✓ Category created: {cat.name}")
                category_map[cat.slug] = cat

            # 6. Seed Products
            products_data = [
                {
                    "name": "Apex Velocity Runner",
                    "slug": "apex-velocity-runner",
                    "category": "footwear",
                    "price": Decimal("139.99"),
                    "compare": Decimal("159.99"),
                    "featured": True,
                    "desc": "Ultra-lightweight carbon-infused road runner designed for marathon energy return and superior cushioning.",
                    "img": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop",
                    "variants": [
                        {"sku": "VEL-RN-08", "name": "Size US 8", "qty": 15},
                        {"sku": "VEL-RN-09", "name": "Size US 9", "qty": 25},
                        {"sku": "VEL-RN-10", "name": "Size US 10", "qty": 30},
                        {"sku": "VEL-RN-11", "name": "Size US 11", "qty": 20},
                    ]
                },
                {
                    "name": "Pulse Training Short 7\"",
                    "slug": "pulse-training-short",
                    "category": "apparel",
                    "price": Decimal("48.00"),
                    "compare": None,
                    "featured": True,
                    "desc": "Four-way stretch sweat-wicking training shorts with built-in compression liner and zippered phone pocket.",
                    "img": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop",
                    "variants": [
                        {"sku": "PLS-SH-S", "name": "Small (30)", "qty": 40},
                        {"sku": "PLS-SH-M", "name": "Medium (32)", "qty": 55},
                        {"sku": "PLS-SH-L", "name": "Large (34)", "qty": 35},
                    ]
                },
                {
                    "name": "AeroVent Performance Tee",
                    "slug": "aerovent-performance-tee",
                    "category": "apparel",
                    "price": Decimal("38.00"),
                    "compare": None,
                    "featured": False,
                    "desc": "Engineered micro-mesh tee with anti-odor silver ion threading for high-intensity gym sessions.",
                    "img": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop",
                    "variants": [
                        {"sku": "AERO-TEE-S", "name": "Charcoal / S", "qty": 20},
                        {"sku": "AERO-TEE-M", "name": "Charcoal / M", "qty": 30},
                        {"sku": "AERO-TEE-L", "name": "Charcoal / L", "qty": 25},
                    ]
                },
                {
                    "name": "Summit Gym Duffle 45L",
                    "slug": "summit-gym-duffle",
                    "category": "accessories",
                    "price": Decimal("75.00"),
                    "compare": Decimal("90.00"),
                    "featured": True,
                    "desc": "Weatherproof ballistic nylon duffle featuring separated ventilated shoe compartment and laptop sleeve.",
                    "img": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop",
                    "variants": [
                        {"sku": "SUM-DUF-BLK", "name": "Matte Black (45L)", "qty": 18},
                    ]
                },
                {
                    "name": "Apex Insulated Flask 32oz",
                    "slug": "apex-insulated-flask",
                    "category": "accessories",
                    "price": Decimal("29.99"),
                    "compare": None,
                    "featured": False,
                    "desc": "Double-wall vacuum-insulated stainless steel water bottle. Keeps liquids cold for 24 hours.",
                    "img": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop",
                    "variants": [
                        {"sku": "FLASK-32-STEEL", "name": "Brushed Steel", "qty": 50},
                    ]
                },
            ]

            for p_info in products_data:
                stmt = select(Product).where(Product.tenant_id == store1.id, Product.slug == p_info["slug"])
                prod = (await session.execute(stmt)).scalar_one_or_none()
                if not prod:
                    prod = Product(
                        id=uuid.uuid4(),
                        tenant_id=store1.id,
                        category_id=category_map[p_info["category"]].id if p_info["category"] in category_map else None,
                        name=p_info["name"],
                        slug=p_info["slug"],
                        description=p_info["desc"],
                        base_price=p_info["price"],
                        compare_at_price=p_info["compare"],
                        currency="USD",
                        is_active=True,
                        is_featured=p_info["featured"],
                    )
                    session.add(prod)
                    await session.flush()

                    # Add image
                    img = ProductImage(
                        id=uuid.uuid4(),
                        tenant_id=store1.id,
                        product_id=prod.id,
                        url=p_info["img"],
                        alt_text=prod.name,
                        is_thumbnail=True,
                    )
                    session.add(img)

                    # Add variants
                    for v in p_info["variants"]:
                        var = ProductVariant(
                            id=uuid.uuid4(),
                            tenant_id=store1.id,
                            product_id=prod.id,
                            sku=v["sku"],
                            name=v["name"],
                            price=p_info["price"],
                            inventory_quantity=v["qty"],
                            is_active=True,
                        )
                        session.add(var)

                    print(f"    ✓ Product created: {prod.name} with {len(p_info['variants'])} variants")

    print("Seeding completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_database())
