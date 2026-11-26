import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="icon-circle">
        <span class="icon">{{ icon }}</span>
      </div>
      <h3 class="title">{{ title }}</h3>
      <p class="description">{{ description }}</p>
      <div class="actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 3rem 1.5rem;
      background: #ffffff;
      border: 1px dashed var(--border, #e2e8f0);
      border-radius: var(--radius-md, 10px);
    }
    .icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--bg-main, #f8fafc);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }
    .icon {
      font-size: 1.5rem;
    }
    .title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-main, #0f172a);
      margin-bottom: 0.5rem;
    }
    .description {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
      max-width: 400px;
      margin-bottom: 1.5rem;
    }
    .actions {
      display: flex;
      gap: 0.75rem;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon = '📦';
  @Input() title = 'No items found';
  @Input() description = 'There is currently no data to display.';
}
