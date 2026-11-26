import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { Category, ProductCreateRequest, ProductDetail, ProductUpdateRequest } from '../../core/models/catalog.models';

@Component({
  selector: 'app-store-admin-product-form',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="form-page-container">
      <div class="page-header">
        <div>
          <a [routerLink]="['/admin', storeSlug, 'products']" class="back-link">
            ← Back to Products
          </a>
          <h1 class="page-title">{{ isEditMode() ? 'Edit Product' : 'Create New Product' }}</h1>
          <p class="page-subtitle">Configure catalogue details, pricing, variants, and media for {{ storeSlug }}.</p>
        </div>

        <div class="header-actions">
          <a [routerLink]="['/admin', storeSlug, 'products']" class="btn btn-secondary">
            Cancel
          </a>
          <button
            type="button"
            class="btn btn-primary"
            (click)="onSubmit()"
            [disabled]="isSubmitting() || form.invalid"
          >
            {{ isSubmitting() ? 'Saving...' : (isEditMode() ? 'Update Product' : 'Create Product') }}
          </button>
        </div>
      </div>

      @if (errorMessage()) {
        <div class="alert alert-error">
          {{ errorMessage() }}
        </div>
      }

      <form [formGroup]="form" class="form-layout">
        <!-- Main Form Columns -->
        <div class="main-column">
          <!-- Card 1: Basic Information -->
          <div class="card form-card">
            <h2 class="card-title">General Information</h2>

            <div class="form-group">
              <label class="form-label" for="name">Product Name *</label>
              <input
                id="name"
                type="text"
                class="form-control"
                formControlName="name"
                placeholder="e.g. Apex Velocity Runner"
                (input)="onNameChange()"
              />
              @if (form.get('name')?.touched && form.get('name')?.invalid) {
                <span class="field-error">Product name is required.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="slug">URL Slug *</label>
              <div class="slug-input-wrapper">
                <span class="slug-prefix">/products/</span>
                <input
                  id="slug"
                  type="text"
                  class="form-control slug-control"
                  formControlName="slug"
                  placeholder="apex-velocity-runner"
                />
              </div>
              @if (form.get('slug')?.touched && form.get('slug')?.invalid) {
                <span class="field-error">Slug must be lowercase alphanumeric and hyphens.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="description">Description</label>
              <textarea
                id="description"
                rows="4"
                class="form-control"
                formControlName="description"
                placeholder="Provide a detailed description of the product features, materials, and benefits..."
              ></textarea>
            </div>
          </div>

          <!-- Card 2: Variants & Stock -->
          <div class="card form-card">
            <div class="card-header-flex">
              <div>
                <h2 class="card-title">Product Variants</h2>
                <p class="card-subtitle">Define sizes, colors, and specific inventory quantities.</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" (click)="addVariantRow()">
                + Add Variant
              </button>
            </div>

            <div class="variants-table-wrapper">
              <table class="variants-table">
                <thead>
                  <tr>
                    <th>SKU *</th>
                    <th>Variant Name *</th>
                    <th>Price Override</th>
                    <th>Stock Qty *</th>
                    <th style="width: 40px;"></th>
                  </tr>
                </thead>
                <tbody formArrayName="variants">
                  @for (vGroup of variantsArray.controls; track $index; let i = $index) {
                    <tr [formGroupName]="i">
                      <td>
                        <input
                          type="text"
                          class="form-control form-control-sm"
                          formControlName="sku"
                          placeholder="APX-VEL-01"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          class="form-control form-control-sm"
                          formControlName="name"
                          placeholder="Size 9 / Black"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.01"
                          class="form-control form-control-sm"
                          formControlName="price"
                          placeholder="Optional"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          class="form-control form-control-sm"
                          formControlName="inventoryQuantity"
                          placeholder="0"
                        />
                      </td>
                      <td>
                        @if (variantsArray.length > 1) {
                          <button
                            type="button"
                            class="btn-icon delete"
                            (click)="removeVariantRow(i)"
                            title="Remove variant"
                          >
                            ✕
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- Card 3: Images & Media -->
          <div class="card form-card">
            <h2 class="card-title">Media & Images</h2>
            <p class="card-subtitle">Upload product images or enter image URLs.</p>

            <div class="upload-dropzone">
              <input
                type="file"
                id="fileUpload"
                (change)="onFileSelected($event)"
                accept="image/*"
                class="file-input-hidden"
              />
              <label for="fileUpload" class="dropzone-label">
                <span class="upload-icon">📷</span>
                <span class="upload-prompt">
                  <strong>Click to upload an image</strong> or drag and drop
                </span>
                <span class="upload-hint">PNG, JPG, WEBP up to 5MB</span>
              </label>
            </div>

            <!-- Manual Image URL adder -->
            <div class="url-image-adder">
              <input
                type="text"
                [(ngModel)]="manualImageUrl"
                [ngModelOptions]="{standalone: true}"
                placeholder="Or paste an image URL (e.g. Unsplash URL)..."
                class="form-control form-control-sm"
              />
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                (click)="addManualImage()"
                [disabled]="!manualImageUrl"
              >
                Add Image
              </button>
            </div>

            <!-- Image previews -->
            @if (imageUrls().length > 0) {
              <div class="image-previews-grid">
                @for (imgUrl of imageUrls(); track imgUrl; let i = $index) {
                  <div class="preview-tile" [class.is-primary]="i === 0">
                    <img [src]="imgUrl" alt="Product preview" />
                    <button
                      type="button"
                      class="remove-img-btn"
                      (click)="removeImage(i)"
                      title="Remove image"
                    >
                      ✕
                    </button>
                    @if (i === 0) {
                      <span class="primary-badge">Cover</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Sidebar Column -->
        <div class="side-column">
          <!-- Card: Status & Visibility -->
          <div class="card form-card">
            <h2 class="card-title">Visibility & Status</h2>

            <div class="checkbox-group">
              <label class="switch-label">
                <input type="checkbox" formControlName="isActive" />
                <span>Active (Available for purchase)</span>
              </label>
            </div>

            <div class="checkbox-group">
              <label class="switch-label">
                <input type="checkbox" formControlName="isFeatured" />
                <span>Featured on homepage</span>
              </label>
            </div>
          </div>

          <!-- Card: Category -->
          <div class="card form-card">
            <h2 class="card-title">Organization</h2>

            <div class="form-group">
              <label class="form-label" for="category">Category</label>
              <select id="category" class="form-control" formControlName="categoryId">
                <option [ngValue]="null">No category</option>
                @for (c of categories(); track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Card: Pricing -->
          <div class="card form-card">
            <h2 class="card-title">Pricing</h2>

            <div class="form-group">
              <label class="form-label" for="basePrice">Base Price *</label>
              <div class="price-input-wrapper">
                <span class="currency-prefix">\$</span>
                <input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  class="form-control price-control"
                  formControlName="basePrice"
                  placeholder="0.00"
                />
              </div>
              @if (form.get('basePrice')?.touched && form.get('basePrice')?.invalid) {
                <span class="field-error">Base price is required and must be &ge; 0.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="compareAtPrice">Compare-At Price</label>
              <div class="price-input-wrapper">
                <span class="currency-prefix">\$</span>
                <input
                  id="compareAtPrice"
                  type="number"
                  step="0.01"
                  class="form-control price-control"
                  formControlName="compareAtPrice"
                  placeholder="0.00"
                />
              </div>
              <span class="field-hint">Original price for showing discount strikes.</span>
            </div>

            <div class="form-group">
              <label class="form-label" for="currency">Currency</label>
              <input
                id="currency"
                type="text"
                class="form-control"
                formControlName="currency"
                placeholder="USD"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-page-container {
      max-width: 1100px;
      margin: 0 auto;
      padding-bottom: 3rem;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .back-link {
      font-size: 0.8125rem;
      color: #64748b;
      text-decoration: none;
      display: inline-block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .back-link:hover {
      color: #0f172a;
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
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.875rem 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }

    .form-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 860px) {
      .form-layout {
        grid-template-columns: 1fr;
      }
    }

    .main-column, .side-column {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }
    .card-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    .card-subtitle {
      font-size: 0.8125rem;
      color: #64748b;
      margin-bottom: 1.25rem;
    }
    .card-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-group:last-child {
      margin-bottom: 0;
    }
    .form-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.35rem;
    }
    .field-hint {
      display: block;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }
    .field-error {
      display: block;
      font-size: 0.75rem;
      color: #dc2626;
      margin-top: 0.25rem;
    }

    .slug-input-wrapper, .price-input-wrapper {
      display: flex;
      align-items: center;
    }
    .slug-prefix, .currency-prefix {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-right: none;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      color: #64748b;
      border-radius: 0.375rem 0 0 0.375rem;
    }
    .slug-control, .price-control {
      border-radius: 0 0.375rem 0.375rem 0;
    }

    .variants-table-wrapper {
      overflow-x: auto;
    }
    .variants-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .variants-table th {
      text-align: left;
      padding: 0.5rem;
      color: #475569;
      font-weight: 600;
      border-bottom: 1px solid #e2e8f0;
    }
    .variants-table td {
      padding: 0.5rem;
      vertical-align: middle;
    }
    .form-control-sm {
      padding: 0.35rem 0.5rem;
      font-size: 0.8125rem;
    }

    .upload-dropzone {
      border: 2px dashed #cbd5e1;
      border-radius: 0.5rem;
      padding: 1.5rem;
      text-align: center;
      background: #f8fafc;
      margin-bottom: 1rem;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .upload-dropzone:hover {
      border-color: #3b82f6;
    }
    .file-input-hidden {
      display: none;
    }
    .dropzone-label {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
    }
    .upload-icon {
      font-size: 1.75rem;
    }
    .upload-prompt {
      font-size: 0.875rem;
      color: #334155;
    }
    .upload-hint {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .url-image-adder {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .image-previews-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 0.75rem;
    }
    .preview-tile {
      position: relative;
      aspect-ratio: 1;
      border-radius: 0.375rem;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      background: #f1f5f9;
    }
    .preview-tile img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .preview-tile.is-primary {
      border: 2px solid #3b82f6;
    }
    .remove-img-btn {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 18px;
      height: 18px;
      background: rgba(0, 0, 0, 0.6);
      color: #ffffff;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .primary-badge {
      position: absolute;
      bottom: 2px;
      left: 2px;
      background: #3b82f6;
      color: #ffffff;
      font-size: 8px;
      font-weight: 700;
      padding: 1px 3px;
      border-radius: 2px;
      text-transform: uppercase;
    }

    .checkbox-group {
      margin-bottom: 1rem;
    }
    .switch-label {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.875rem;
      cursor: pointer;
      user-select: none;
    }
    .switch-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
    }
  `]
})
export class StoreAdminProductFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);

  storeSlug = '';
  productId: string | null = null;
  readonly isEditMode = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly categories = signal<Category[]>([]);
  readonly imageUrls = signal<string[]>([]);

  manualImageUrl = '';

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: [''],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    compareAtPrice: [null],
    currency: ['USD'],
    categoryId: [null],
    isActive: [true],
    isFeatured: [false],
    variants: this.fb.array([]),
  });

  get variantsArray(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  ngOnInit(): void {
    this.storeSlug =
      this.route.snapshot.paramMap.get('storeSlug') ||
      this.route.parent?.snapshot.paramMap.get('storeSlug') ||
      'apex-athletics';

    this.productId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(!!this.productId);

    this.loadCategories();

    if (this.productId) {
      this.loadExistingProduct(this.productId);
    } else {
      // Default: 1 default variant row
      this.addVariantRow('DEFAULT', 'Standard', 0);
    }
  }

  loadCategories(): void {
    this.catalogService.adminGetCategories(this.storeSlug).subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Failed to load categories', err),
    });
  }

  loadExistingProduct(id: string): void {
    this.catalogService.adminGetProduct(this.storeSlug, id).subscribe({
      next: (product) => {
        this.form.patchValue({
          name: product.name,
          slug: product.slug,
          description: product.description,
          basePrice: product.basePrice ?? product.base_price,
          compareAtPrice: product.compareAtPrice ?? product.compare_at_price,
          currency: product.currency,
          categoryId: product.categoryId ?? product.category_id,
          isActive: product.isActive ?? product.is_active,
          isFeatured: product.isFeatured ?? product.is_featured,
        });

        if (product.images && product.images.length > 0) {
          this.imageUrls.set(product.images.map((img) => img.url));
        } else if (product.thumbnailUrl || product.thumbnail_url) {
          this.imageUrls.set([product.thumbnailUrl || product.thumbnail_url || '']);
        }

        this.variantsArray.clear();
        if (product.variants && product.variants.length > 0) {
          for (const v of product.variants) {
            this.addVariantRow(
              v.sku,
              v.name,
              v.inventoryQuantity ?? v.inventory_quantity ?? 0,
              v.price
            );
          }
        } else {
          this.addVariantRow('DEFAULT', 'Standard', 0);
        }
      },
      error: (err) => {
        this.errorMessage.set('Could not load existing product: ' + (err.error?.detail || err.message));
      },
    });
  }

  addVariantRow(sku = '', name = '', qty = 0, price: number | null = null): void {
    const group = this.fb.group({
      sku: [sku, Validators.required],
      name: [name, Validators.required],
      price: [price],
      inventoryQuantity: [qty, [Validators.required, Validators.min(0)]],
    });
    this.variantsArray.push(group);
  }

  removeVariantRow(index: number): void {
    if (this.variantsArray.length > 1) {
      this.variantsArray.removeAt(index);
    }
  }

  onNameChange(): void {
    if (!this.isEditMode()) {
      const name = this.form.get('name')?.value || '';
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      this.form.patchValue({ slug });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.catalogService.adminUploadMedia(this.storeSlug, file).subscribe({
      next: (res) => {
        this.imageUrls.update((imgs) => [...imgs, res.url]);
      },
      error: (err) => {
        alert('File upload failed: ' + (err.error?.detail || err.message));
      },
    });
  }

  addManualImage(): void {
    if (this.manualImageUrl.trim()) {
      this.imageUrls.update((imgs) => [...imgs, this.manualImageUrl.trim()]);
      this.manualImageUrl = '';
    }
  }

  removeImage(index: number): void {
    this.imageUrls.update((imgs) => imgs.filter((_, i) => i !== index));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const fv = this.form.value;

    if (this.isEditMode() && this.productId) {
      const updateData: ProductUpdateRequest = {
        name: fv.name,
        slug: fv.slug,
        description: fv.description,
        basePrice: fv.basePrice,
        compareAtPrice: fv.compareAtPrice,
        currency: fv.currency,
        categoryId: fv.categoryId,
        isActive: fv.isActive,
        isFeatured: fv.isFeatured,
      };

      this.catalogService.adminUpdateProduct(this.storeSlug, this.productId, updateData).subscribe({
        next: () => {
          this.router.navigate(['/admin', this.storeSlug, 'products']);
        },
        error: (err) => {
          this.errorMessage.set('Update failed: ' + (err.error?.detail || err.message));
          this.isSubmitting.set(false);
        },
      });
    } else {
      const createData: ProductCreateRequest = {
        name: fv.name,
        slug: fv.slug,
        description: fv.description,
        basePrice: fv.basePrice,
        compareAtPrice: fv.compareAtPrice,
        currency: fv.currency,
        categoryId: fv.categoryId,
        isActive: fv.isActive,
        isFeatured: fv.isFeatured,
        variants: fv.variants.map((v: any) => ({
          sku: v.sku,
          name: v.name,
          price: v.price || null,
          inventoryQuantity: v.inventoryQuantity || 0,
        })),
        images: this.imageUrls().map((url, idx) => ({
          url,
          sortOrder: idx,
          isThumbnail: idx === 0,
        })),
      };

      this.catalogService.adminCreateProduct(this.storeSlug, createData).subscribe({
        next: () => {
          this.router.navigate(['/admin', this.storeSlug, 'products']);
        },
        error: (err) => {
          this.errorMessage.set('Create failed: ' + (err.error?.detail || err.message));
          this.isSubmitting.set(false);
        },
      });
    }
  }
}
