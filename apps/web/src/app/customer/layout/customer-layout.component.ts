import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="customer-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <a routerLink="/" class="brand-link">
            <span>🛒 Storefront</span>
          </a>
        </div>

        <div class="user-brief">
          <div class="avatar">{{ authService.currentUser()?.displayName?.charAt(0) || 'U' }}</div>
          <div class="user-meta">
            <span class="user-name">{{ authService.currentUser()?.displayName }}</span>
            <span class="user-email">{{ authService.currentUser()?.email }}</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/account" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            📊 Overview
          </a>
        </nav>

        <div class="sidebar-footer">
          <button class="btn btn-secondary w-full" (click)="authService.logout().subscribe()">
            Sign Out
          </button>
        </div>
      </aside>

      <div class="content-wrapper">
        <header class="topbar">
          <span class="topbar-title">Customer Portal</span>
          <div class="topbar-actions">
            <a routerLink="/" class="btn btn-secondary btn-sm">Return to Store</a>
          </div>
        </header>

        <main class="page-container">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .customer-shell {
      display: flex;
      min-height: 100vh;
      background: var(--bg-main);
    }
    .sidebar {
      width: 260px;
      background: #ffffff;
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 1.5rem 1rem;
    }
    .sidebar-brand {
      margin-bottom: 1.5rem;
      padding-left: 0.5rem;
    }
    .brand-link {
      font-weight: 700;
      color: var(--text-main);
      text-decoration: none;
    }
    .user-brief {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--bg-main);
      border-radius: var(--radius-sm);
      margin-bottom: 1.5rem;
    }
    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }
    .user-meta {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .user-email {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
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
      color: var(--text-muted);
      text-decoration: none;
      transition: all 0.15s;
    }
    .nav-item:hover, .nav-item.active {
      background: var(--primary-light);
      color: var(--primary);
    }
    .sidebar-footer {
      margin-top: auto;
      padding-top: 1rem;
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
    .topbar-title {
      font-weight: 600;
      font-size: 1rem;
    }
    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
    }
    .page-container {
      flex: 1;
      padding: 2rem;
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
    }
  `]
})
export class CustomerLayoutComponent {
  readonly authService = inject(AuthService);
}
