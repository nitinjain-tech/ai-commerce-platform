import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TenantContextService } from '../../core/services/tenant-context.service';
import { CatalogService } from '../../core/services/catalog.service';
import { Category, ProductListItem } from '../../core/models/catalog.models';

@Component({
  selector: 'app-storefront-home',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  template: `
    <!-- Storefront Hero Banner -->
    <section class="store-hero">
      <div class="hero-container">
        <div class="store-meta">
          @if (tenantContext.currentTenant()?.logoUrl || tenantContext.currentTenant()?.logo_url) {
            <img
              [src]="tenantContext.currentTenant()?.logoUrl || tenantContext.currentTenant()?.logo_url"
              [alt]="tenantContext.currentTenant()?.name"
              class="store-logo"
            />
          }
          <div>
            <span class="tenant-badge">Official Store</span>
            <h1 class="store-title">{{ tenantContext.currentTenant()?.name || 'Apex Athletics' }}</h1>
            <p class="store-tagline">
              {{ tenantContext.currentTenant()?.description || 'Engineered for endurance. Premium athletic apparel and footwear.' }}
            </p>
          </div>
        </div>

        @if (!authService.isAuthenticated()) {
          <div class="demo-login-callout">
            <span class="callout-title">💡 Demo Access</span>
            <div class="credentials-pills">
              <span>Customer: <code>customer&#64;apex.local</code> / <code>Customer123!</code></span>
              <span>Admin: <code>storeadmin&#64;apex.local</code> / <code>StoreAdmin123!</code></span>
            </div>
            <div class="hero-auth-actions">
              <a routerLink="/login" class="btn btn-primary btn-sm">Sign In</a>
              <a routerLink="/register" class="btn btn-secondary btn-sm">Create Account</a>
            </div>
          </div>
        } @else {
          <div class="auth-welcome-callout">
            <span>Welcome back, <strong>{{ authService.currentUser()?.displayName }}</strong>!</span>
            <div class="hero-auth-actions">
              @for (m of authService.currentUser()?.memberships; track m.storeSlug) {
                @if (m.role === 'store_admin' || m.role === 'store_staff') {
                  <a [routerLink]="['/admin', m.storeSlug]" class="btn btn-secondary btn-sm">
                    ⚙️ Store Admin ({{ m.storeName || m.storeSlug }})
                  </a>
                }
              }
              <a routerLink="/account" class="btn btn-primary btn-sm">My Account</a>
            </div>
          </div>
        }
      </div>
    </section>

    <!-- Catalog Controls: Search & Category Filter -->
    <section class="catalog-header">
      <div class="category-tabs">
        <button
          type="button"
          class="tab-btn"
          [class.active]="selectedCategorySlug() === null"
          (click)="onSelectCategory(null)"
        >
          All Gear
        </button>
        @for (category of categories(); track category.id) {
          <button
            type="button"
            class="tab-btn"
            [class.active]="selectedCategorySlug() === category.slug"
            (click)="onSelectCategory(category.slug)"
          >
            {{ category.name }}
          </button>
        }
      </div>

      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search footwear, apparel, gear..."
          [(ngModel)]="searchQuery"
          (input)="onSearchInput()"
          class="search-input"
        />
        @if (searchQuery) {
          <button type="button" class="clear-search-btn" (click)="clearSearch()">✕</button>
        }
      </div>
    </section>

    <!-- Products Grid -->
    <section class="catalog-section">
      @if (isLoading()) {
        <div class="products-grid">
          @for (n of [1,2,3,4,5,6]; track n) {
            <div class="product-skeleton-card">
              <div class="skeleton-img"></div>
              <div class="skeleton-text skeleton-title"></div>
              <div class="skeleton-text skeleton-sub"></div>
            </div>
          }
        </div>
      } @else if (products().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">👟</div>
          <h3>No products found</h3>
          <p>Try selecting another category or clearing your search query.</p>
          <button type="button" class="btn btn-secondary btn-sm" (click)="resetFilters()">
            Reset Filters
          </button>
        </div>
      } @else {
        <div class="products-grid">
          @for (prod of products(); track prod.id) {
            <a [routerLink]="['/products', prod.slug]" class="product-card">
              <div class="product-img-wrapper">
                <img
                  [src]="prod.thumbnailUrl || prod.thumbnail_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop'"
                  [alt]="prod.name"
                  class="product-img"
                  loading="lazy"
                />
                @if (prod.isFeatured || prod.is_featured) {
                  <span class="badge-featured">Featured</span>
                }
              </div>

              <div class="product-info">
                @if (prod.categoryName || prod.category_name) {
                  <span class="category-pill">{{ prod.categoryName || prod.category_name }}</span>
                }
                <h3 class="product-name">{{ prod.name }}</h3>

                <div class="product-pricing">
                  <span class="price">\${{ (prod.basePrice || prod.base_price || 0) | number:'1.2-2' }}</span>
                  @if (prod.compareAtPrice || prod.compare_at_price) {
                    <span class="compare-price">
                      \${{ (prod.compareAtPrice || prod.compare_at_price) | number:'1.2-2' }}
                    </span>
                  }
                </div>

                <div class="inventory-status">
                  @if ((prod.totalInventory || prod.total_inventory || 0) > 0) {
                    <span class="status-badge in-stock">
                      ● In Stock ({{ prod.totalInventory || prod.total_inventory }} available)
                    </span>
                  } @else {
                    <span class="status-badge out-of-stock">
                      ○ Sold Out
                    </span>
                  }
                </div>
              </div>
            </a>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .store-hero {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      border-radius: 1rem;
      padding: 2.5rem 2rem;
      margin-bottom: 2.5rem;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
    }
    .hero-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .store-meta {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      max-width: 650px;
    }
    .store-logo {
      width: 72px;
      height: 72px;
      border-radius: 1rem;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
    }
    .tenant-badge {
      display: inline-block;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: rgba(59, 130, 246, 0.2);
      color: #60a5fa;
      margin-bottom: 0.4rem;
    }
    .store-title {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      margin-bottom: 0.35rem;
      color: #ffffff;
    }
    .store-tagline {
      font-size: 0.9375rem;
      color: #94a3b8;
      line-height: 1.5;
    }
    .demo-login-callout, .auth-welcome-callout {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.75rem;
      padding: 1.25rem;
      font-size: 0.8125rem;
      min-width: 280px;
      backdrop-filter: blur(8px);
    }
    .callout-title {
      font-weight: 600;
      color: #38bdf8;
      display: block;
      margin-bottom: 0.5rem;
    }
    .credentials-pills {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1rem;
      color: #cbd5e1;
    }
    .credentials-pills code {
      background: rgba(0, 0, 0, 0.3);
      padding: 0.1rem 0.35rem;
      border-radius: 0.25rem;
      color: #f8fafc;
      font-family: monospace;
      font-size: 0.75rem;
    }
    .hero-auth-actions {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .catalog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .category-tabs {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
    }
    .tab-btn {
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .tab-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .tab-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }
    .search-box {
      position: relative;
      min-width: 280px;
      flex: 1;
      max-width: 380px;
    }
    .search-input {
      width: 100%;
      padding: 0.6rem 2.25rem 0.6rem 2.25rem;
      border-radius: 9999px;
      border: 1px solid #cbd5e1;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.875rem;
      color: #94a3b8;
    }
    .clear-search-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      font-size: 0.75rem;
      color: #94a3b8;
      cursor: pointer;
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.75rem;
    }
    .product-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.875rem;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.08);
      border-color: #cbd5e1;
    }
    .product-img-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      background: #f8fafc;
      overflow: hidden;
    }
    .product-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    .product-card:hover .product-img {
      transform: scale(1.04);
    }
    .badge-featured {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      background: #0f172a;
      color: #ffffff;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
    }
    .product-info {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .category-pill {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.35rem;
    }
    .product-name {
      font-size: 1.0625rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.5rem;
      line-height: 1.3;
    }
    .product-pricing {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
      margin-top: auto;
      margin-bottom: 0.75rem;
    }
    .price {
      font-size: 1.125rem;
      font-weight: 800;
      color: #0f172a;
    }
    .compare-price {
      font-size: 0.875rem;
      color: #94a3b8;
      text-decoration: line-through;
    }
    .inventory-status {
      font-size: 0.75rem;
      font-weight: 500;
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }
    .status-badge.in-stock {
      color: #16a34a;
    }
    .status-badge.out-of-stock {
      color: #dc2626;
    }

    .empty-state {
      text-align: center;
      padding: 5rem 1rem;
      background: #ffffff;
      border: 1px dashed #cbd5e1;
      border-radius: 1rem;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 0.75rem;
    }
    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.35rem;
    }
    .empty-state p {
      color: #64748b;
      font-size: 0.9375rem;
      margin-bottom: 1.25rem;
    }

    .product-skeleton-card {
      background: #ffffff;
      border-radius: 0.875rem;
      border: 1px solid #e2e8f0;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .skeleton-img {
      width: 100%;
      aspect-ratio: 1;
      background: #e2e8f0;
      border-radius: 0.5rem;
      animation: pulse 1.5s infinite;
    }
    .skeleton-text {
      background: #e2e8f0;
      border-radius: 0.25rem;
      animation: pulse 1.5s infinite;
    }
    .skeleton-title {
      height: 1.2rem;
      width: 70%;
    }
    .skeleton-sub {
      height: 0.9rem;
      width: 40%;
    }
    @keyframes pulse {
      0% { opacity: 0.6; }
      50% { opacity: 0.3; }
      100% { opacity: 0.6; }
    }
  `]
})
export class StorefrontHomeComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly tenantContext = inject(TenantContextService);
  private readonly catalogService = inject(CatalogService);

  readonly categories = signal<Category[]>([]);
  readonly products = signal<ProductListItem[]>([]);
  readonly selectedCategorySlug = signal<string | null>(null);
  readonly isLoading = signal<boolean>(true);

  searchQuery = '';
  private searchTimeout: any;

  ngOnInit(): void {
    this.loadCatalogData();
  }

  loadCatalogData(): void {
    this.isLoading.set(true);

    // Load categories
    this.catalogService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err),
    });

    this.fetchProducts();
  }

  fetchProducts(): void {
    this.isLoading.set(true);
    const categorySlug = this.selectedCategorySlug() || undefined;
    const search = this.searchQuery.trim() || undefined;

    this.catalogService
      .getProducts({
        categorySlug,
        search,
      })
      .subscribe({
        next: (items) => {
          this.products.set(items);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Failed to load products', err);
          this.isLoading.set(false);
        },
      });
  }

  onSelectCategory(slug: string | null): void {
    this.selectedCategorySlug.set(slug);
    this.fetchProducts();
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.fetchProducts();
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.fetchProducts();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCategorySlug.set(null);
    this.fetchProducts();
  }
}
