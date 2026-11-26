import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, EmptyStateComponent],
  template: `
    <app-page-header
      title="Customer Account Overview"
      subtitle="Manage your global identity, active store memberships, and orders"
    ></app-page-header>

    <div class="dashboard-grid">
      <div class="card profile-card">
        <h3 class="card-title">Global Profile</h3>
        <div class="info-row">
          <span class="label">Display Name:</span>
          <span class="value">{{ authService.currentUser()?.displayName }}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">{{ authService.currentUser()?.email }}</span>
        </div>
        <div class="info-row">
          <span class="label">Global ID:</span>
          <span class="value code-font">{{ authService.currentUser()?.id }}</span>
        </div>
      </div>

      <div class="card memberships-card">
        <h3 class="card-title">Store Memberships</h3>
        @if (authService.currentUser()?.memberships?.length) {
          <div class="memberships-list">
            @for (m of authService.currentUser()?.memberships; track m.storeId) {
              <div class="membership-item">
                <div>
                  <span class="store-name">{{ m.storeName || m.storeSlug }}</span>
                  <span class="store-slug">({{ m.storeSlug }})</span>
                </div>
                <div class="membership-badge">
                  <span class="badge badge-primary">{{ m.role }}</span>
                  @if (m.role === 'store_admin' || m.role === 'store_staff') {
                    <a [routerLink]="['/admin', m.storeSlug]" class="btn btn-secondary btn-xs">
                      Admin
                    </a>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <app-empty-state
            icon="🏪"
            title="No store memberships"
            description="You do not currently belong to any specific store customer lists."
          ></app-empty-state>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border);
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.875rem;
    }
    .label {
      color: var(--text-muted);
    }
    .value {
      font-weight: 500;
    }
    .code-font {
      font-family: monospace;
      font-size: 0.75rem;
    }
    .memberships-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .membership-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: var(--bg-main);
      border-radius: var(--radius-sm);
    }
    .store-name {
      font-weight: 600;
      font-size: 0.875rem;
    }
    .store-slug {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-left: 0.35rem;
    }
    .membership-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .btn-xs {
      padding: 0.2rem 0.5rem;
      font-size: 0.75rem;
    }
  `]
})
export class CustomerDashboardComponent {
  readonly authService = inject(AuthService);
}
