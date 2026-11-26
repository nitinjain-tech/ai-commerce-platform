import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TenantContextService } from '../../core/services/tenant-context.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-storefront-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  template: `
    <div class="storefront-wrapper">
      <header class="navbar">
        <div class="nav-container">
          <div class="logo-wrapper">
            <a routerLink="/" class="logo">
              <span class="logo-badge">🛒</span>
              <span>{{ tenantContext.currentTenant()?.name || 'Commerce Platform' }}</span>
            </a>
            <button type="button" class="switch-store-btn" (click)="promptSwitchStore()" title="Switch active store">
              ⇄ Switch Store
            </button>
          </div>

          <nav class="nav-links">
            <a routerLink="/" class="nav-link">Home</a>
            
            @if (authService.isAuthenticated()) {
              <a routerLink="/account" class="nav-link">Account</a>

              @if (authService.isPlatformAdmin()) {
                <a routerLink="/platform" class="badge badge-primary">Platform Admin</a>
              }

              <div class="user-menu">
                <span class="user-name">{{ authService.currentUser()?.displayName }}</span>
                <button class="btn btn-secondary btn-sm" (click)="authService.logout().subscribe()">Sign Out</button>
              </div>
            } @else {
              <a routerLink="/login" class="nav-link">Sign In</a>
              <a routerLink="/register" class="btn btn-primary btn-sm">Register</a>
            }
          </nav>
        </div>
      </header>

      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <footer class="footer">
        <div class="footer-container">
          <p>&copy; 2026 {{ tenantContext.currentTenant()?.name || 'AI Commerce Platform' }}. Multi-tenant modular monolith.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .storefront-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .navbar {
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .nav-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .switch-store-btn {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .switch-store-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 1.125rem;
      color: var(--text-main);
      text-decoration: none;
    }
    .logo-badge {
      font-size: 1.25rem;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .nav-link {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.15s;
    }
    .nav-link:hover {
      color: var(--primary);
    }
    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-left: 1px solid var(--border);
      padding-left: 1rem;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-main);
    }
    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }
    .main-content {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }
    .footer {
      background: #ffffff;
      border-top: 1px solid var(--border);
      padding: 1.5rem;
      margin-top: auto;
    }
    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
  `]
})
export class StorefrontLayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly tenantContext = inject(TenantContextService);

  ngOnInit(): void {
    this.tenantContext.loadCurrentTenant().subscribe();
  }

  promptSwitchStore(): void {
    const current = this.tenantContext.activeStoreSlug();
    const target = prompt('Enter the store slug to view its storefront:', current);
    if (target && target.trim() && target.trim().toLowerCase() !== current) {
      const cleanSlug = target.trim().toLowerCase();
      this.tenantContext.setActiveStoreSlug(cleanSlug);
      window.location.href = '/?store=' + encodeURIComponent(cleanSlug);
    }
  }
}
