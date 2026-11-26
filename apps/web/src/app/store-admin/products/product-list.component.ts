import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { Category, ProductListItem } from '../../core/models/catalog.models';

@Component({
  selector: 'app-store-admin-product-list',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Products</h1>
        <p class="page-subtitle">Manage store catalogue, inventory, pricing, and variants for {{ storeSlug }}.</p>
      </div>
      <a [routerLink]="['/admin', storeSlug, 'products', 'new']" class="btn btn-primary">
        + Add Product
      </a>
    </div>

    <!-- Filter & Search Toolbar -->
    <div class="toolbar-card">
      <div class="search-field">
        <input
          type="text"
          placeholder="Filter products by name or SKU..."
          [(ngModel)]="searchQuery"
          (input)="onSearchInput()"
          class="form-control"
        />
      </div>

      <div class="filter-group">
        <select class="form-control select-category" [(ngModel)]="selectedCategoryId" (change)="loadProducts()">
          <option [ngValue]="null">All Categories</option>
          @for (c of categories(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
      </div>
    </div>

    <!-- Products Table -->
    <div class="card table-container">
      @if (isLoading()) {
        <div class="loading-state">
          <span>Loading products for {{ storeSlug }}...</span>
        </div>
      } @else if (products().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>No products in catalogue</h3>
          <p>Get started by adding your first product to this store.</p>
          <a [routerLink]="['/admin', storeSlug, 'products', 'new']" class="btn btn-primary btn-sm">
            + Create First Product
          </a>
        </div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 64px;">Image</th>
              <th>Product Details</th>
              <th>Category</th>
              <th>Base Price</th>
              <th>Inventory</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr>
                <td>
                  <img
                    [src]="p.thumbnailUrl || p.thumbnail_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop'"
                    [alt]="p.name"
                    class="table-thumb"
                  />
                </td>
                <td>
                  <div class="product-meta">
                    <span class="product-title">{{ p.name }}</span>
                    <span class="product-slug">/{{ p.slug }}</span>
                  </div>
                </td>
                <td>
                  <span class="category-badge">{{ p.categoryName || p.category_name || 'Uncategorized' }}</span>
                </td>
                <td>
                  <span class="price-val">\${{ (p.basePrice || p.base_price || 0) | number:'1.2-2' }}</span>
                </td>
                <td>
                  <span
                    class="inventory-pill"
                    [class.in-stock]="(p.totalInventory || p.total_inventory || 0) > 0"
                    [class.out-stock]="(p.totalInventory || p.total_inventory || 0) <= 0"
                  >
                    {{ p.totalInventory || p.total_inventory || 0 }} in stock
                  </span>
                </td>
                <td>
                  @if (p.isActive) {
                    <span class="badge badge-success">Active</span>
                  } @else {
                    <span class="badge badge-secondary">Draft</span>
                  }
                </td>
                <td style="text-align: right;">
                  <div class="table-actions">
                    <a [routerLink]="['/admin', storeSlug, 'products', p.id, 'edit']" class="btn-icon" title="Edit">
                      ✏️
                    </a>
                    <button type="button" class="btn-icon delete" (click)="deleteProduct(p)" title="Delete">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .page-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.025em;
      margin-bottom: 0.25rem;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
    }

    .toolbar-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .search-field {
      flex: 1;
      min-width: 250px;
    }
    .select-category {
      min-width: 200px;
    }

    .table-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      overflow-x: auto;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .data-table th {
      background: #f8fafc;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .data-table td {
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }
    .data-table tr:last-child td {
      border-bottom: none;
    }
    .table-thumb {
      width: 48px;
      height: 48px;
      border-radius: 0.375rem;
      object-fit: cover;
      background: #f1f5f9;
    }
    .product-meta {
      display: flex;
      flex-direction: column;
    }
    .product-title {
      font-weight: 600;
      color: #0f172a;
    }
    .product-slug {
      font-size: 0.75rem;
      color: #94a3b8;
      font-family: monospace;
    }
    .category-badge {
      background: #f1f5f9;
      color: #475569;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .price-val {
      font-weight: 600;
      color: #0f172a;
    }
    .inventory-pill {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.5rem;
      border-radius: 9999px;
    }
    .inventory-pill.in-stock {
      background: #dcfce7;
      color: #15803d;
    }
    .inventory-pill.out-stock {
      background: #fee2e2;
      color: #b91c1c;
    }
    .table-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }
    .btn-icon {
      background: none;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
      padding: 0.35rem 0.6rem;
      cursor: pointer;
      text-decoration: none;
      font-size: 0.875rem;
      transition: background 0.15s;
    }
    .btn-icon:hover {
      background: #f1f5f9;
    }
    .btn-icon.delete:hover {
      background: #fee2e2;
      border-color: #fca5a5;
    }

    .loading-state, .empty-state {
      padding: 4rem 1rem;
      text-align: center;
    }
    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    .empty-state h3 {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .empty-state p {
      color: #64748b;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
  `]
})
export class StoreAdminProductListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogService = inject(CatalogService);

  storeSlug = '';
  readonly products = signal<ProductListItem[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal<boolean>(true);

  searchQuery = '';
  selectedCategoryId: string | null = null;
  private searchTimeout: any;

  ngOnInit(): void {
    this.storeSlug =
      this.route.snapshot.paramMap.get('storeSlug') ||
      this.route.parent?.snapshot.paramMap.get('storeSlug') ||
      'apex-athletics';

    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.catalogService.adminGetCategories(this.storeSlug).subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    const categoryId = this.selectedCategoryId || undefined;
    const search = this.searchQuery.trim() || undefined;

    this.catalogService
      .adminGetProducts(this.storeSlug, { categoryId, search })
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

  onSearchInput(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadProducts();
    }, 300);
  }

  deleteProduct(product: ProductListItem): void {
    if (confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      this.catalogService.adminDeleteProduct(this.storeSlug, product.id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: (err) => {
          alert('Failed to delete product: ' + (err.error?.detail || err.message));
        },
      });
    }
  }
}
