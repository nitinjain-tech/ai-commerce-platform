import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { Category, CategoryCreateRequest, CategoryUpdateRequest } from '../../core/models/catalog.models';

@Component({
  selector: 'app-store-admin-category-list',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Categories</h1>
        <p class="page-subtitle">Organize products into customer-facing departments for {{ storeSlug }}.</p>
      </div>
      <button type="button" class="btn btn-primary" (click)="openCreateModal()">
        + Add Category
      </button>
    </div>

    <!-- Categories List Table -->
    <div class="card table-container">
      @if (isLoading()) {
        <div class="state-box">Loading categories...</div>
      } @else if (categories().length === 0) {
        <div class="state-box">
          <div class="empty-icon">📑</div>
          <h3>No categories created yet</h3>
          <p>Create categories to group your products for easier shopping.</p>
          <button type="button" class="btn btn-primary btn-sm" (click)="openCreateModal()">
            + Create First Category
          </button>
        </div>
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 56px;">Cover</th>
              <th>Category Name</th>
              <th>Slug</th>
              <th>Order</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (cat of categories(); track cat.id) {
              <tr>
                <td>
                  <img
                    [src]="cat.imageUrl || cat.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop'"
                    [alt]="cat.name"
                    class="cat-thumb"
                  />
                </td>
                <td>
                  <span class="cat-name">{{ cat.name }}</span>
                  @if (cat.description) {
                    <span class="cat-desc">{{ cat.description }}</span>
                  }
                </td>
                <td>
                  <code class="cat-slug">/{{ cat.slug }}</code>
                </td>
                <td>{{ cat.sortOrder || cat.sort_order || 0 }}</td>
                <td>
                  @if (cat.isActive) {
                    <span class="badge badge-success">Active</span>
                  } @else {
                    <span class="badge badge-secondary">Hidden</span>
                  }
                </td>
                <td style="text-align: right;">
                  <div class="table-actions">
                    <button type="button" class="btn-icon" (click)="openEditModal(cat)" title="Edit">
                      ✏️
                    </button>
                    <button type="button" class="btn-icon delete" (click)="deleteCategory(cat)" title="Delete">
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

    <!-- Modal: Create / Edit Category -->
    @if (isModalOpen()) {
      <div class="modal-backdrop">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ editingCategoryId ? 'Edit Category' : 'Create Category' }}</h3>
            <button type="button" class="close-btn" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="saveCategory()" class="modal-body">
            @if (modalError()) {
              <div class="alert alert-error">{{ modalError() }}</div>
            }

            <div class="form-group">
              <label class="form-label" for="catName">Category Name *</label>
              <input
                id="catName"
                type="text"
                class="form-control"
                formControlName="name"
                placeholder="e.g. Footwear"
                (input)="onNameChange()"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="catSlug">Slug *</label>
              <input
                id="catSlug"
                type="text"
                class="form-control"
                formControlName="slug"
                placeholder="footwear"
              />
            </div>

            <div class="form-group">
              <label class="form-label" for="catDesc">Description</label>
              <textarea
                id="catDesc"
                rows="2"
                class="form-control"
                formControlName="description"
                placeholder="Brief summary of products in this category..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label" for="catImg">Image URL</label>
              <input
                id="catImg"
                type="text"
                class="form-control"
                formControlName="imageUrl"
                placeholder="https://..."
              />
            </div>

            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label class="form-label" for="sortOrder">Sort Order</label>
                <input
                  id="sortOrder"
                  type="number"
                  class="form-control"
                  formControlName="sortOrder"
                />
              </div>

              <div class="form-group checkbox-align">
                <label class="switch-label">
                  <input type="checkbox" formControlName="isActive" />
                  <span>Active</span>
                </label>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || isSaving()">
                {{ isSaving() ? 'Saving...' : 'Save Category' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
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
    .cat-thumb {
      width: 44px;
      height: 44px;
      border-radius: 0.375rem;
      object-fit: cover;
      background: #f1f5f9;
    }
    .cat-name {
      font-weight: 600;
      color: #0f172a;
      display: block;
    }
    .cat-desc {
      font-size: 0.75rem;
      color: #64748b;
      display: block;
    }
    .cat-slug {
      font-size: 0.75rem;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.15rem 0.35rem;
      border-radius: 0.25rem;
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
      font-size: 0.875rem;
    }
    .btn-icon:hover {
      background: #f1f5f9;
    }
    .btn-icon.delete:hover {
      background: #fee2e2;
      border-color: #fca5a5;
    }

    .state-box {
      padding: 4rem 1rem;
      text-align: center;
    }
    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    .state-box h3 {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }
    .state-box p {
      color: #64748b;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
      padding: 1rem;
    }
    .modal-card {
      background: #ffffff;
      border-radius: 0.75rem;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }
    .modal-header h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1rem;
      color: #94a3b8;
      cursor: pointer;
    }
    .modal-body {
      padding: 1.5rem;
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .form-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.35rem;
    }
    .form-row {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .checkbox-align {
      margin-top: 1rem;
    }
    .switch-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      cursor: pointer;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.75rem;
      border-radius: 0.375rem;
      margin-bottom: 1rem;
      font-size: 0.8125rem;
    }
  `]
})
export class StoreAdminCategoryListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);

  storeSlug = '';
  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isModalOpen = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  editingCategoryId: string | null = null;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    description: [''],
    imageUrl: [''],
    sortOrder: [0],
    isActive: [true],
  });

  ngOnInit(): void {
    this.storeSlug =
      this.route.snapshot.paramMap.get('storeSlug') ||
      this.route.parent?.snapshot.paramMap.get('storeSlug') ||
      'apex-athletics';

    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading.set(true);
    this.catalogService.adminGetCategories(this.storeSlug).subscribe({
      next: (items) => {
        this.categories.set(items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load categories', err);
        this.isLoading.set(false);
      },
    });
  }

  openCreateModal(): void {
    this.editingCategoryId = null;
    this.modalError.set(null);
    this.form.reset({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      sortOrder: this.categories().length + 1,
      isActive: true,
    });
    this.isModalOpen.set(true);
  }

  openEditModal(category: Category): void {
    this.editingCategoryId = category.id;
    this.modalError.set(null);
    this.form.patchValue({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      imageUrl: category.imageUrl || category.image_url || '',
      sortOrder: category.sortOrder ?? category.sort_order ?? 0,
      isActive: category.isActive ?? category.is_active ?? true,
    });
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingCategoryId = null;
  }

  onNameChange(): void {
    if (!this.editingCategoryId) {
      const name = this.form.get('name')?.value || '';
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      this.form.patchValue({ slug });
    }
  }

  saveCategory(): void {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    this.modalError.set(null);
    const fv = this.form.value;

    if (this.editingCategoryId) {
      const updateData: CategoryUpdateRequest = {
        name: fv.name,
        slug: fv.slug,
        description: fv.description,
        imageUrl: fv.imageUrl,
        sortOrder: fv.sortOrder,
        isActive: fv.isActive,
      };

      this.catalogService.adminUpdateCategory(this.storeSlug, this.editingCategoryId, updateData).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadCategories();
        },
        error: (err) => {
          this.modalError.set('Update failed: ' + (err.error?.detail || err.message));
          this.isSaving.set(false);
        },
      });
    } else {
      const createData: CategoryCreateRequest = {
        name: fv.name,
        slug: fv.slug,
        description: fv.description,
        imageUrl: fv.imageUrl,
        sortOrder: fv.sortOrder,
        isActive: fv.isActive,
      };

      this.catalogService.adminCreateCategory(this.storeSlug, createData).subscribe({
        next: () => {
          this.isSaving.set(false);
          this.closeModal();
          this.loadCategories();
        },
        error: (err) => {
          this.modalError.set('Creation failed: ' + (err.error?.detail || err.message));
          this.isSaving.set(false);
        },
      });
    }
  }

  deleteCategory(cat: Category): void {
    if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      this.catalogService.adminDeleteCategory(this.storeSlug, cat.id).subscribe({
        next: () => {
          this.loadCategories();
        },
        error: (err) => {
          alert('Failed to delete category: ' + (err.error?.detail || err.message));
        },
      });
    }
  }
}
