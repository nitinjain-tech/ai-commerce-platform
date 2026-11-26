import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Tenant } from '../../core/models/tenant.models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type ModalMode = 'none' | 'create-tenant' | 'invite-admin';

@Component({
  selector: 'app-platform-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PageHeaderComponent, LoadingSpinnerComponent, EmptyStateComponent],
  template: `
    <app-page-header
      title="Platform Tenants & Stores"
      subtitle="Super-admin oversight across all isolated commerce stores"
    >
      <div actions>
        <button class="btn btn-primary" (click)="openModal('create-tenant')">
          + Provision New Store
        </button>
      </div>
    </app-page-header>

    @if (successMessage()) {
      <div class="global-alert alert-success">
        ✓ {{ successMessage() }}
      </div>
    }

    @if (isLoading) {
      <app-loading-spinner message="Loading registered stores..."></app-loading-spinner>
    } @else if (tenants.length === 0) {
      <app-empty-state
        icon="🏪"
        title="No stores registered"
        description="Click 'Provision New Store' to create your first commerce tenant."
      ></app-empty-state>
    } @else {
      <div class="card table-card">
        <table class="tenants-table">
          <thead>
            <tr>
              <th>Store Name</th>
              <th>Slug / Identifier</th>
              <th>Custom Domain</th>
              <th>Status</th>
              <th>Storefront</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (t of tenants; track t.id) {
              <tr>
                <td class="font-semibold">{{ t.name }}</td>
                <td><code class="slug-badge">{{ t.slug }}</code></td>
                <td class="text-muted">{{ t.domain || '—' }}</td>
                <td>
                  <span class="badge badge-primary">Active</span>
                </td>
                <td>
                  <div class="storefront-links">
                    <a
                      href="/?store={{ t.slug }}"
                      target="_blank"
                      class="btn btn-secondary btn-xs"
                      title="View public storefront"
                    >
                      🌐 View Storefront
                    </a>
                    <code class="url-hint">/?store={{ t.slug }}</code>
                  </div>
                </td>
                <td>
                  <div class="action-group">
                    <a [routerLink]="['/admin', t.slug]" class="btn btn-secondary btn-xs">
                      ⚙️ Admin
                    </a>
                    <button
                      type="button"
                      class="btn btn-primary btn-xs"
                      (click)="openInviteModal(t)"
                      title="Invite or create a store admin user"
                    >
                      👤 Invite Admin
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- How-to Guide -->
    <div class="card info-card">
      <h3>🚀 New Tenant Onboarding Guide</h3>
      <div class="steps-grid">
        <div class="step-card">
          <div class="step-num">1</div>
          <div>
            <strong>Provision Store</strong>
            <p>Click "+ Provision New Store" to create a tenant with a unique slug (e.g. <code>my-brand</code>).</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-num">2</div>
          <div>
            <strong>Invite Store Admin</strong>
            <p>Click "👤 Invite Admin" on the store row. This creates their account and grants <code>store_admin</code> access.</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-num">3</div>
          <div>
            <strong>Admin Logs In & Adds Products</strong>
            <p>Store admin logs in at <code>/login</code> and is redirected to <code>/admin/&lt;slug&gt;</code> to manage products.</p>
          </div>
        </div>
        <div class="step-card">
          <div class="step-num">4</div>
          <div>
            <strong>Customers Access Storefront</strong>
            <p>Customers visit <code>/?store=&lt;slug&gt;</code> or via subdomain <code>&lt;slug&gt;.localhost:4200</code> to browse & shop.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Provision New Tenant -->
    @if (modalMode() === 'create-tenant') {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-card card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Provision New Commerce Tenant</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <p class="modal-sub">Creates an isolated tenant partition with PostgreSQL RLS protection.</p>

          @if (modalError()) {
            <div class="alert alert-error">{{ modalError() }}</div>
          }

          <form [formGroup]="createForm" (ngSubmit)="onCreateTenant()">
            <div class="form-group">
              <label class="form-label">Store Name *</label>
              <input type="text" class="form-control" formControlName="name"
                placeholder="Green Leaf Organics" (input)="onTenantNameChange()" />
            </div>

            <div class="form-group">
              <label class="form-label">URL Slug * <span class="hint">(lowercase, hyphens only)</span></label>
              <div class="slug-preview">
                <span class="slug-prefix">/?store=</span>
                <input type="text" class="form-control slug-control" formControlName="slug"
                  placeholder="green-leaf" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Custom Domain <span class="hint">(optional)</span></label>
              <input type="text" class="form-control" formControlName="domain"
                placeholder="greenleaf.example.com" />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="createForm.invalid || isSubmitting">
                {{ isSubmitting ? 'Creating...' : 'Create Tenant' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Modal: Invite Store Admin -->
    @if (modalMode() === 'invite-admin') {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal-card card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Invite User to <code>{{ inviteTargetTenant?.slug }}</code></h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <p class="modal-sub">
            Create a user account and assign them a role on <strong>{{ inviteTargetTenant?.name }}</strong>.
            If the email already exists, their role membership is updated.
          </p>

          @if (modalError()) {
            <div class="alert alert-error">{{ modalError() }}</div>
          }

          <form [formGroup]="inviteForm" (ngSubmit)="onInviteAdmin()">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" class="form-control" formControlName="displayName"
                placeholder="Jane Smith" />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" class="form-control" formControlName="email"
                placeholder="jane@greenleaf.example.com" />
            </div>

            <div class="form-group">
              <label class="form-label">Temporary Password *</label>
              <input type="text" class="form-control" formControlName="password"
                placeholder="Min 8 characters" />
              <span class="field-hint">Share this with the store owner securely.</span>
            </div>

            <div class="form-group">
              <label class="form-label">Role *</label>
              <select class="form-control" formControlName="role">
                <option value="store_admin">store_admin — Full catalog & settings control</option>
                <option value="store_staff">store_staff — Can manage products, not settings</option>
                <option value="customer">customer — Shopper account only</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="inviteForm.invalid || isSubmitting">
                {{ isSubmitting ? 'Saving...' : 'Create & Assign Role' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .global-alert {
      padding: 0.875rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 1.5rem;
    }
    .alert-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
    }
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.75rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .table-card { padding: 0; overflow: hidden; }
    .tenants-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }
    .tenants-table th {
      background: var(--bg-main);
      padding: 0.875rem 1.25rem;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
    }
    .tenants-table td {
      padding: 0.875rem 1.25rem;
      border-bottom: 1px solid var(--border);
      vertical-align: middle;
    }
    .font-semibold { font-weight: 600; }
    .text-muted { color: var(--text-muted); }
    .slug-badge {
      background: #f1f5f9;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-size: 0.8125rem;
    }
    .storefront-links {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .url-hint {
      font-size: 0.7rem;
      color: #94a3b8;
      background: #f8fafc;
      padding: 0.1rem 0.3rem;
      border-radius: 3px;
    }
    .action-group {
      display: flex;
      gap: 0.5rem;
    }
    .btn-xs {
      padding: 0.3rem 0.6rem;
      font-size: 0.75rem;
    }

    .info-card {
      padding: 1.5rem;
      margin-top: 2rem;
      border-left: 4px solid var(--primary);
    }
    .info-card h3 {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .step-card {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1rem;
      font-size: 0.8125rem;
    }
    .step-num {
      background: var(--primary);
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.75rem;
      flex-shrink: 0;
    }
    .step-card strong { display: block; margin-bottom: 0.25rem; color: #0f172a; }
    .step-card p { color: #64748b; margin: 0; line-height: 1.4; }
    .step-card code { background: #e2e8f0; padding: 0.1rem 0.25rem; border-radius: 3px; font-size: 0.75rem; }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 1rem;
    }
    .modal-card {
      max-width: 500px;
      width: 100%;
      padding: 1.75rem 2rem;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
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
    .modal-sub {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0.25rem 0 1.5rem;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .form-group { margin-bottom: 1.25rem; }
    .form-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.35rem;
    }
    .hint {
      font-weight: 400;
      color: #94a3b8;
      font-size: 0.75rem;
    }
    .field-hint {
      display: block;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 0.25rem;
    }
    .slug-preview {
      display: flex;
      align-items: center;
    }
    .slug-prefix {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-right: none;
      padding: 0.5rem 0.6rem;
      font-size: 0.8125rem;
      color: #64748b;
      border-radius: 0.375rem 0 0 0.375rem;
    }
    .slug-control { border-radius: 0 0.375rem 0.375rem 0; }
  `]
})
export class PlatformAdminDashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  tenants: Tenant[] = [];
  isLoading = true;
  isSubmitting = false;
  inviteTargetTenant: Tenant | null = null;

  readonly modalMode = signal<ModalMode>('none');
  readonly successMessage = signal<string>('');
  readonly modalError = signal<string>('');

  createForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    domain: [''],
  });

  inviteForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['store_admin', Validators.required],
  });

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.isLoading = true;
    this.http.get<Tenant[]>('/api/v1/tenants').subscribe({
      next: (data) => { this.tenants = data; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  openModal(mode: ModalMode): void {
    this.modalMode.set(mode);
    this.modalError.set('');
    this.successMessage.set('');
    this.createForm.reset();
  }

  openInviteModal(tenant: Tenant): void {
    this.inviteTargetTenant = tenant;
    this.inviteForm.reset({ role: 'store_admin' });
    this.modalError.set('');
    this.successMessage.set('');
    this.modalMode.set('invite-admin');
  }

  closeModal(): void {
    this.modalMode.set('none');
    this.inviteTargetTenant = null;
  }

  onTenantNameChange(): void {
    const name = this.createForm.get('name')?.value || '';
    const slug = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    this.createForm.patchValue({ slug });
  }

  onCreateTenant(): void {
    if (this.createForm.invalid) return;
    this.isSubmitting = true;
    this.modalError.set('');

    const val = { ...this.createForm.value };
    if (!val.domain) delete val.domain;

    this.http.post<Tenant>('/api/v1/tenants', val).subscribe({
      next: (created) => {
        this.tenants.push(created);
        this.closeModal();
        this.isSubmitting = false;
        this.successMessage.set(`Store '${created.name}' provisioned! Now click '👤 Invite Admin' to set up the store owner.`);
        setTimeout(() => this.successMessage.set(''), 8000);
      },
      error: (err) => {
        this.modalError.set(err?.error?.detail || 'Failed to create tenant.');
        this.isSubmitting = false;
      }
    });
  }

  onInviteAdmin(): void {
    if (this.inviteForm.invalid || !this.inviteTargetTenant) return;
    this.isSubmitting = true;
    this.modalError.set('');

    const payload = {
      ...this.inviteForm.value,
      storeSlug: this.inviteTargetTenant.slug,
    };

    this.http.post<{ user: any; message: string }>('/api/v1/auth/invite-store-admin', payload).subscribe({
      next: (res) => {
        this.closeModal();
        this.isSubmitting = false;
        const role = this.inviteForm.get('role')?.value;
        const slug = this.inviteTargetTenant?.slug;
        this.successMessage.set(
          `✓ ${res.user.email} has been assigned '${role}' on '${slug}'. They can now log in at /login and access /admin/${slug}.`
        );
        setTimeout(() => this.successMessage.set(''), 10000);
      },
      error: (err) => {
        this.modalError.set(err?.error?.detail || 'Failed to invite admin.');
        this.isSubmitting = false;
      }
    });
  }
}
