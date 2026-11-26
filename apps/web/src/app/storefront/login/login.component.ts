import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="login-wrapper">
      <div class="card login-card">
        <h2 class="title">Sign In</h2>
        <p class="subtitle">Access your account and managed stores</p>

        @if (errorMessage) {
          <div class="alert alert-danger">{{ errorMessage }}</div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="email">Email address</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              placeholder="you@example.com"
              autocomplete="email"
            />
            @if (loginForm.get('email')?.touched && loginForm.get('email')?.invalid) {
              <small class="error-msg">Please enter a valid email address.</small>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            @if (loginForm.get('password')?.touched && loginForm.get('password')?.invalid) {
              <small class="error-msg">Password is required.</small>
            }
          </div>

          <button
            type="submit"
            class="btn btn-primary submit-btn"
            [disabled]="loginForm.invalid || isLoading"
          >
            @if (isLoading) {
              <app-loading-spinner [size]="18"></app-loading-spinner>
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="footer-links">
          <span>Don't have an account? </span>
          <a routerLink="/register">Register here</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 65vh;
      padding: 1rem;
    }
    .login-card {
      max-width: 420px;
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
    .submit-btn {
      width: 100%;
      margin-top: 0.5rem;
      padding: 0.75rem;
      font-weight: 600;
    }
    .error-msg {
      color: var(--danger);
      font-size: 0.75rem;
      margin-top: 0.25rem;
      display: block;
    }
    .footer-links {
      text-align: center;
      margin-top: 1.75rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isLoading = false;
  errorMessage = '';

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else if (res.user.isPlatformAdmin) {
          this.router.navigate(['/platform']);
        } else if (res.user.memberships.length > 0) {
          const adminMembership = res.user.memberships.find(m => m.role === 'store_admin');
          if (adminMembership) {
            this.router.navigate(['/admin', adminMembership.storeSlug]);
          } else {
            this.router.navigate(['/account']);
          }
        } else {
          this.router.navigate(['/account']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err?.error?.detail || 'Invalid email or password. Please try again.';
      }
    });
  }
}
