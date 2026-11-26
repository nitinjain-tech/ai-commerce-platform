import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="status-page">
      <div class="status-card card">
        <div class="code">403</div>
        <h1 class="title">Access Denied</h1>
        <p class="message">You do not have permission to view or manage this resource.</p>
        <div class="actions">
          <a routerLink="/" class="btn btn-primary">Return to Storefront</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .status-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80vh;
      padding: 1.5rem;
    }
    .status-card {
      text-align: center;
      max-width: 480px;
      width: 100%;
      padding: 3rem 2rem;
    }
    .code {
      font-size: 3.5rem;
      font-weight: 800;
      color: var(--danger, #dc2626);
      line-height: 1;
      margin-bottom: 1rem;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .message {
      color: var(--text-muted, #64748b);
      margin-bottom: 2rem;
    }
    .actions {
      display: flex;
      justify-content: center;
    }
  `]
})
export class ForbiddenComponent {}
