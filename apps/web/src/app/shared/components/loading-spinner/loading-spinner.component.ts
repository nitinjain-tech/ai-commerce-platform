import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="spinner-container" [class.overlay]="overlay">
      <div class="spinner" [style.width.px]="size" [style.height.px]="size"></div>
      @if (message) {
        <p class="spinner-msg">{{ message }}</p>
      }
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .spinner-container.overlay {
      position: absolute;
      inset: 0;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(2px);
      z-index: 50;
    }
    .spinner {
      border: 3px solid #e2e8f0;
      border-top-color: var(--primary, #2563eb);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner-msg {
      margin-top: 0.75rem;
      font-size: 0.875rem;
      color: var(--text-muted, #64748b);
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size = 36;
  @Input() message?: string;
  @Input() overlay = false;
}
