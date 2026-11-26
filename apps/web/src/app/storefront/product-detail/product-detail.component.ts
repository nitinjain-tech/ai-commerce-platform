import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { TenantContextService } from '../../core/services/tenant-context.service';
import { ProductDetail, ProductVariant } from '../../core/models/catalog.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  template: `
    <div class="product-page-container">
      <nav class="breadcrumb">
        <a routerLink="/" class="back-link">← Back to Storefront</a>
      </nav>

      @if (isLoading()) {
        <div class="product-detail-skeleton">
          <div class="skeleton-gallery"></div>
          <div class="skeleton-meta">
            <div class="skeleton-line skeleton-title"></div>
            <div class="skeleton-line skeleton-price"></div>
            <div class="skeleton-line skeleton-desc"></div>
          </div>
        </div>
      } @else if (errorMessage()) {
        <div class="error-container">
          <h2>Product Not Found</h2>
          <p>{{ errorMessage() }}</p>
          <a routerLink="/" class="btn btn-primary">Return to Catalog</a>
        </div>
      } @else if (product()) {
        <div class="product-detail-layout">
          <!-- Left Column: Image Gallery -->
          <div class="gallery-column">
            <div class="main-image-frame">
              <img
                [src]="activeImage() || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop'"
                [alt]="product()?.name"
                class="main-image"
              />
            </div>

            @if (product()?.images && product()!.images.length > 1) {
              <div class="thumbnail-strip">
                @for (img of product()!.images; track img.id) {
                  <button
                    type="button"
                    class="thumb-btn"
                    [class.active]="activeImage() === img.url"
                    (click)="activeImage.set(img.url)"
                  >
                    <img [src]="img.url" [alt]="img.altText || product()?.name" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- Right Column: Product Info & Purchase Options -->
          <div class="info-column">
            @if (product()?.category?.name) {
              <span class="category-tag">{{ product()?.category?.name }}</span>
            }

            <h1 class="product-title">{{ product()?.name }}</h1>

            <div class="pricing-box">
              <span class="current-price">\${{ effectivePrice() | number:'1.2-2' }}</span>
              @if (product()?.compareAtPrice || product()?.compare_at_price) {
                <span class="compare-price">
                  \${{ (product()?.compareAtPrice || product()?.compare_at_price) | number:'1.2-2' }}
                </span>
                <span class="discount-badge">Sale</span>
              }
            </div>

            <div class="description-section">
              <p>{{ product()?.description || 'No description provided for this product.' }}</p>
            </div>

            <!-- Variant Selector -->
            @if (product()?.variants && product()!.variants.length > 0) {
              <div class="variants-section">
                <label class="section-label">
                  Select Option: <strong>{{ selectedVariant()?.name }}</strong>
                </label>
                <div class="variant-pills">
                  @for (variant of product()!.variants; track variant.id) {
                    <button
                      type="button"
                      class="variant-btn"
                      [class.active]="selectedVariant()?.id === variant.id"
                      [class.out-of-stock]="(variant.inventoryQuantity || variant.inventory_quantity || 0) <= 0"
                      (click)="onSelectVariant(variant)"
                    >
                      <span class="v-name">{{ variant.name }}</span>
                      @if ((variant.inventoryQuantity || variant.inventory_quantity || 0) <= 0) {
                        <span class="v-badge out">Sold Out</span>
                      }
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Stock Status -->
            <div class="stock-indicator">
              @if (isCurrentVariantInStock()) {
                <span class="stock-badge in-stock">
                  ✓ In Stock ({{ currentVariantStock() }} available)
                </span>
              } @else {
                <span class="stock-badge out-of-stock">
                  ✕ Out of stock
                </span>
              }
            </div>

            <!-- Quantity & Add to Cart -->
            <div class="purchase-actions">
              <div class="quantity-picker">
                <button
                  type="button"
                  class="qty-btn"
                  (click)="decreaseQty()"
                  [disabled]="quantity() <= 1"
                >
                  −
                </button>
                <span class="qty-display">{{ quantity() }}</span>
                <button
                  type="button"
                  class="qty-btn"
                  (click)="increaseQty()"
                  [disabled]="quantity() >= currentVariantStock() || !isCurrentVariantInStock()"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                class="btn btn-primary btn-add-cart"
                [disabled]="!isCurrentVariantInStock()"
                (click)="onAddToCart()"
              >
                🛒 Add to Cart
              </button>
            </div>

            @if (feedbackMessage()) {
              <div class="feedback-toast">
                {{ feedbackMessage() }}
              </div>
            }

            <!-- Trust features -->
            <div class="trust-features">
              <div class="trust-item">
                <span class="trust-icon">⚡</span>
                <div>
                  <strong>Fast Fulfillment</strong>
                  <p>Orders ship within 24 hours of placement</p>
                </div>
              </div>
              <div class="trust-item">
                <span class="trust-icon">🔒</span>
                <div>
                  <strong>Secure Multi-Tenant Checkout</strong>
                  <p>Row-Level Security guaranteed data privacy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .product-page-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1rem 0 3rem;
    }
    .breadcrumb {
      margin-bottom: 2rem;
    }
    .back-link {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      text-decoration: none;
      transition: color 0.15s;
    }
    .back-link:hover {
      color: #0f172a;
    }

    .product-detail-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.5rem;
      align-items: start;
    }
    @media (max-width: 820px) {
      .product-detail-layout {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }

    .gallery-column {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .main-image-frame {
      width: 100%;
      aspect-ratio: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      overflow: hidden;
    }
    .main-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .thumbnail-strip {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
    }
    .thumb-btn {
      width: 72px;
      height: 72px;
      border-radius: 0.5rem;
      border: 2px solid #e2e8f0;
      background: #f8fafc;
      padding: 0;
      cursor: pointer;
      overflow: hidden;
      transition: border-color 0.15s;
    }
    .thumb-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .thumb-btn.active {
      border-color: #0f172a;
    }

    .info-column {
      display: flex;
      flex-direction: column;
    }
    .category-tag {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #3b82f6;
      margin-bottom: 0.5rem;
    }
    .product-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      line-height: 1.2;
      margin-bottom: 1rem;
    }
    .pricing-box {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    .current-price {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
    }
    .compare-price {
      font-size: 1.125rem;
      color: #94a3b8;
      text-decoration: line-through;
    }
    .discount-badge {
      background: #fee2e2;
      color: #ef4444;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
      text-transform: uppercase;
    }
    .description-section {
      color: #475569;
      line-height: 1.6;
      margin-bottom: 1.75rem;
      font-size: 0.9375rem;
    }

    .variants-section {
      margin-bottom: 1.5rem;
    }
    .section-label {
      display: block;
      font-size: 0.875rem;
      color: #334155;
      margin-bottom: 0.75rem;
    }
    .variant-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .variant-btn {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.15s ease;
    }
    .variant-btn:hover {
      border-color: #0f172a;
    }
    .variant-btn.active {
      border-color: #0f172a;
      background: #0f172a;
      color: #ffffff;
    }
    .variant-btn.out-of-stock {
      opacity: 0.5;
      text-decoration: line-through;
    }
    .v-badge.out {
      font-size: 0.65rem;
      background: #f1f5f9;
      color: #64748b;
      padding: 0.1rem 0.35rem;
      border-radius: 0.25rem;
    }

    .stock-indicator {
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
      font-weight: 600;
    }
    .stock-badge.in-stock {
      color: #16a34a;
    }
    .stock-badge.out-of-stock {
      color: #dc2626;
    }

    .purchase-actions {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .quantity-picker {
      display: flex;
      align-items: center;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      background: #ffffff;
      overflow: hidden;
    }
    .qty-btn {
      background: #f8fafc;
      border: none;
      width: 40px;
      height: 44px;
      font-size: 1.125rem;
      cursor: pointer;
      color: #0f172a;
      transition: background 0.15s;
    }
    .qty-btn:hover:not(:disabled) {
      background: #e2e8f0;
    }
    .qty-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .qty-display {
      width: 44px;
      text-align: center;
      font-weight: 700;
      font-size: 0.9375rem;
    }
    .btn-add-cart {
      flex: 1;
      height: 46px;
      font-size: 0.9375rem;
      font-weight: 700;
    }

    .feedback-toast {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 1.5rem;
      animation: fadeIn 0.3s;
    }

    .trust-features {
      border-top: 1px solid #e2e8f0;
      padding-top: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .trust-item {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      font-size: 0.8125rem;
      color: #475569;
    }
    .trust-item strong {
      color: #0f172a;
      display: block;
      margin-bottom: 0.15rem;
    }
    .trust-icon {
      font-size: 1.25rem;
    }

    .product-detail-skeleton {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.5rem;
    }
    .skeleton-gallery {
      aspect-ratio: 1;
      background: #e2e8f0;
      border-radius: 1rem;
    }
    .skeleton-meta {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .skeleton-line {
      background: #e2e8f0;
      border-radius: 0.375rem;
    }
    .skeleton-title {
      height: 2.5rem;
      width: 80%;
    }
    .skeleton-price {
      height: 2rem;
      width: 30%;
    }
    .skeleton-desc {
      height: 6rem;
      width: 100%;
    }

    .error-container {
      text-align: center;
      padding: 4rem 1rem;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);
  readonly tenantContext = inject(TenantContextService);

  readonly product = signal<ProductDetail | null>(null);
  readonly selectedVariant = signal<ProductVariant | null>(null);
  readonly activeImage = signal<string | null>(null);
  readonly quantity = signal<number>(1);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly feedbackMessage = signal<string | null>(null);

  readonly effectivePrice = computed(() => {
    const v = this.selectedVariant();
    if (v && v.price !== null && v.price !== undefined) {
      return v.price;
    }
    const p = this.product();
    return p ? (p.basePrice || p.base_price || 0) : 0;
  });

  readonly currentVariantStock = computed(() => {
    const v = this.selectedVariant();
    if (v) {
      return v.inventoryQuantity ?? v.inventory_quantity ?? 0;
    }
    const p = this.product();
    return p ? (p.totalInventory ?? p.total_inventory ?? 0) : 0;
  });

  readonly isCurrentVariantInStock = computed(() => {
    return this.currentVariantStock() > 0;
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadProduct(slug);
      }
    });
  }

  loadProduct(slug: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.catalogService.getProductBySlug(slug).subscribe({
      next: (detail) => {
        this.product.set(detail);
        if (detail.variants && detail.variants.length > 0) {
          this.selectedVariant.set(detail.variants[0]);
        }
        if (detail.images && detail.images.length > 0) {
          this.activeImage.set(detail.images[0].url);
        } else if (detail.thumbnailUrl || detail.thumbnail_url) {
          this.activeImage.set(detail.thumbnailUrl || detail.thumbnail_url || null);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load product', err);
        this.errorMessage.set('We could not find the product you requested.');
        this.isLoading.set(false);
      },
    });
  }

  onSelectVariant(variant: ProductVariant): void {
    this.selectedVariant.set(variant);
    this.quantity.set(1);
  }

  increaseQty(): void {
    if (this.quantity() < this.currentVariantStock()) {
      this.quantity.update((q) => q + 1);
    }
  }

  decreaseQty(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  onAddToCart(): void {
    const p = this.product();
    const v = this.selectedVariant();
    const qty = this.quantity();

    this.feedbackMessage.set(
      `✓ Added ${qty}x "${p?.name}${v ? ' (' + v.name + ')' : ''}" to your cart!`
    );

    setTimeout(() => {
      this.feedbackMessage.set(null);
    }, 4000);
  }
}
