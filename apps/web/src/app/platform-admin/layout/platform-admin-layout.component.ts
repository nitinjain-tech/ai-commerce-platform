import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-platform-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="platform-shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="badge badge-platform">Super Admin</span>
          <h2 class="title">Platform Hub</h2>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/platform" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            🌐 Multi-Tenant Stores
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/" class="btn btn-secondary w-full btn-sm">Storefront</a>
        </div>
      </aside>

      <div class="content-wrapper">
        <header class="topbar">
          <div class="platform-indicator">
            <span class="cross-tenant-badge">Cross-Tenant Mode</span>
            <span class="text-muted">Global Platform Supervision</span>
          </div>

          <div class="topbar-user">
            <span class="user-name">{{ authService.currentUser()?.displayName }}</span>
            <button class="btn btn-secondary btn-sm" (click)="authService.logout().subscribe()">Sign Out</button>
          </div>
        </header>

        <main class="page-container">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .platform-shell {
      display: flex;
      min-height: 100vh;
      background: var(--bg-main);
    }
    .sidebar {
      width: 260px;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
    }
    .sidebar-header {
      margin-bottom: 2rem;
      padding-left: 0.5rem;
    }
    .badge-platform {
      background: #3b82f6;
      color: #ffffff;
      font-size: 0.6875rem;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0.5rem;
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
    .platform-indicator {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.875rem;
    }
    .cross-tenant-badge {
      background: #f1f5f9;
      color: #334155;
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.75rem;
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
export class PlatformAdminLayoutComponent {
  readonly authService = inject(AuthService);
}
