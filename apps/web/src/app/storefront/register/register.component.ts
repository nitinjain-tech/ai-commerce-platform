import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TenantContextService } from '../../core/services/tenant-context.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="register-wrapper">
      <div class="card register-card">
        <h2 class="title">Create Account</h2>
        <p class="subtitle">Join {{ tenantContext.currentTenant()?.name || 'our commerce network' }}</p>

        @if (errorMessage) {
          <div class="alert alert-danger">{{ errorMessage }}</div>
        }

        @if (successMessage) {
          <div class="alert alert-success">{{ successMessage }}</div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="displayName">Full Name</label>
            <input
              id="displayName"
              type="text"
              class="form-control"
              formControlName="displayName"
              placeholder="Jane Doe"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email address</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              placeholder="you@example.com"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="Minimum 8 characters"
            />
          </div>

          <button
            type="submit"
            class="btn btn-primary submit-btn"
            [disabled]="registerForm.invalid || isLoading"
          >
            @if (isLoading) {
              <app-loading-spinner [size]="18"></app-loading-spinner>
            } @else {
              Register
            }
          </button>
        </form>

        <div class="footer-links">
          <span>Already have an account? </span>
          <a routerLink="/login">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 65vh;
      padding: 1rem;
    }
    .register-card {
      max-width: 440px;
      width: 100%;
      padding: 2.25rem 2rem;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.35rem;
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 1.75rem;
    }
    .alert {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }
    .alert-danger {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: var(--danger);
    }
    .alert-success {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: var(--success);
    }
    .submit-btn {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.75rem;
      font-weight: 600;
    }
    .footer-links {
      text-align: center;
      margin-top: 1.75rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
  `]
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly tenantContext = inject(TenantContextService);

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  registerForm: FormGroup = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      ...this.registerForm.value,
      store_slug: this.tenantContext.currentTenant()?.slug || undefined,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Account created successfully! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Registration failed. Please try again.';
      }
    });
  }
}
