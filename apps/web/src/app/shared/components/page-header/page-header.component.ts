import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header-container">
      <div>
        <h1 class="header-title">{{ title }}</h1>
        @if (subtitle) {
          <p class="header-subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="header-actions">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      gap: 1rem;
    }
    .header-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main, #0f172a);
      letter-spacing: -0.02em;
    }
    .header-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
      margin-top: 0.25rem;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
  `]
})
export class PageHeaderComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
