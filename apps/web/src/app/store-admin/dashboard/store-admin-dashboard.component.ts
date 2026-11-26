import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-store-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  template: `
    <app-page-header
      [title]="'Store Administration: ' + storeSlug"
      subtitle="Tenant-scoped management area with PostgreSQL RLS isolation"
    ></app-page-header>

    <div class="metrics-grid">
      <div class="card metric-card">
        <span class="metric-label">Store Status</span>
        <span class="metric-value status-active">Active</span>
        <span class="metric-sub">Isolation: PostgreSQL RLS</span>
      </div>

      <div class="card metric-card">
        <span class="metric-label">Active Scope</span>
        <span class="metric-value">{{ storeSlug }}</span>
        <span class="metric-sub">Tenant Partition Key</span>
      </div>

      <div class="card metric-card">
        <span class="metric-label">Your Store Role</span>
        <span class="metric-value">{{ userStoreRole }}</span>
        <span class="metric-sub">Verified via JWT & DB</span>
      </div>
    </div>

    <!-- Quick Actions Card -->
    <div class="quick-actions-section">
      <h3 class="section-heading">Catalog Operations</h3>
      <div class="actions-grid">
        <a [routerLink]="['/admin', storeSlug, 'products']" class="card action-card">
          <div class="action-icon">📦</div>
          <div>
            <h4>Products & Inventory</h4>
            <p>View, create, and manage products, variants, and stock levels.</p>
          </div>
        </a>

        <a [routerLink]="['/admin', storeSlug, 'categories']" class="card action-card">
          <div class="action-icon">📑</div>
          <div>
            <h4>Store Categories</h4>
            <p>Organize products into departments for storefront navigation.</p>
          </div>
        </a>
      </div>
    </div>

    <div class="card info-box">
      <h3>Phase 3 Catalogue & RLS Boundaries Active</h3>
      <p>
        Queries executing against this store are partitioned automatically at the database layer via PostgreSQL Row-Level Security.
        The Catalog, Variants, and Images adhere strictly to the tenant boundary for <code>{{ storeSlug }}</code>.
      </p>
    </div>
  `,
  styles: [`
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
    }
    .metric-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .metric-value {
      font-size: 1.75rem;
      font-weight: 700;
      margin: 0.5rem 0 0.25rem;
      color: var(--text-main);
    }
    .status-active {
      color: var(--success);
    }
    .metric-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .quick-actions-section {
      margin-bottom: 2rem;
    }
    .section-heading {
      font-size: 1.125rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 1rem;
    }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .action-card {
      display: flex;
      gap: 1rem;
      padding: 1.25rem;
      text-decoration: none;
      color: inherit;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      background: #ffffff;
      transition: all 0.2s ease;
    }
    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      border-color: #3b82f6;
    }
    .action-icon {
      font-size: 2rem;
    }
    .action-card h4 {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.25rem;
    }
    .action-card p {
      font-size: 0.8125rem;
      color: #64748b;
      margin: 0;
      line-height: 1.4;
    }
    .info-box {
      padding: 1.5rem;
      border-left: 4px solid var(--primary);
    }
    .info-box h3 {
      font-size: 1.125rem;
      margin-bottom: 0.5rem;
    }
    .info-box p {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
    }
  `]
})
export class StoreAdminDashboardComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);

  storeSlug = '';
  userStoreRole = 'store_admin';

  ngOnInit(): void {
    this.storeSlug = this.route.parent?.snapshot.paramMap.get('storeSlug') || '';
    const user = this.authService.currentUser();
    if (user?.isPlatformAdmin) {
      this.userStoreRole = 'platform_admin (Superuser)';
    } else {
      const membership = user?.memberships.find(m => m.storeSlug === this.storeSlug);
      if (membership) {
        this.userStoreRole = membership.role;
      }
    }
  }
}
