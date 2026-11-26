import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-store-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="admin-shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="store-badge">Store Admin</span>
          <h2 class="store-slug">{{ storeSlug }}</h2>
        </div>

        <nav class="sidebar-nav">
          <a [routerLink]="['/admin', storeSlug]" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            📊 Store Overview
          </a>
          <div class="nav-divider"></div>
          <span class="nav-section-title">Catalogue</span>
          <a [routerLink]="['/admin', storeSlug, 'products']" routerLinkActive="active" class="nav-item">
            📦 Products
          </a>
          <a [routerLink]="['/admin', storeSlug, 'categories']" routerLinkActive="active" class="nav-item">
            📑 Categories
          </a>
          <div class="nav-divider"></div>
          <span class="nav-section-title">Sales (Next Phase)</span>
          <a class="nav-item disabled">🛍️ Orders</a>
          <a class="nav-item disabled">👥 Customers</a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/" class="btn btn-secondary w-full btn-sm">Exit Admin</a>
        </div>
      </aside>

      <div class="content-wrapper">
        <header class="topbar">
          <div class="store-context-pill">
            <span class="dot"></span>
            <span>Store Scope: <strong>{{ storeSlug }}</strong></span>
          </div>

          <div class="topbar-user">
            <span class="user-name">{{ authService.currentUser()?.displayName }}</span>
            <button class="btn btn-secondary btn-sm" (click)="authService.logout().subscribe()">Logout</button>
          </div>
        </header>

        <main class="page-container">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      min-height: 100vh;
      background: var(--bg-main);
    }
    .sidebar {
      width: 260px;
      background: #1e293b;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
    }
    .sidebar-header {
      margin-bottom: 2rem;
      padding-left: 0.5rem;
    }
    .store-badge {
      font-size: 0.6875rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }
    .store-slug {
      font-size: 1.125rem;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0.25rem;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      flex: 1;
    }
    .nav-item {
      padding: 0.625rem 0.875rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 500;
      color: #94a3b8;
      text-decoration: none;
      transition: all 0.15s;
    }
    .nav-item:hover, .nav-item.active {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }
    .nav-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .nav-section-title {
      font-size: 0.6875rem;
      text-transform: uppercase;
      font-weight: 600;
      color: #64748b;
      margin: 0.75rem 0.5rem 0.25rem;
    }
    .nav-divider {
      height: 1px;
      background: #334155;
      margin: 0.75rem 0;
    }
    .sidebar-footer {
      margin-top: auto;
    }
    .w-full {
      width: 100%;
    }
    .content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .topbar {
      height: 64px;
      background: #ffffff;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
    }
    .store-context-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
    }
    .topbar-user {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
    }
    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }
    .page-container {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
    }
  `]
})
export class StoreAdminLayoutComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly authService = inject(AuthService);
  storeSlug = '';

  ngOnInit(): void {
    this.storeSlug = this.route.snapshot.paramMap.get('storeSlug') || '';
  }
}
