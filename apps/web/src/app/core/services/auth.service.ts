import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User, UserRole, StoreMembership } from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  readonly isAuthenticated = computed(() => !!this._currentUser());
  readonly isPlatformAdmin = computed(() => this._currentUser()?.isPlatformAdmin ?? false);
  readonly memberships = computed(() => this._currentUser()?.memberships ?? []);

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/v1/auth/login', credentials, { withCredentials: true }).pipe(
      tap((response) => {
        this.tokenStorage.setToken(response.accessToken);
        this._currentUser.set(response.user);
      })
    );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post('/api/v1/auth/register', data);
  }

  refreshSession(): Observable<AuthResponse | null> {
    return this.http.post<AuthResponse>('/api/v1/auth/refresh', {}, { withCredentials: true }).pipe(
      tap((response) => {
        this.tokenStorage.setToken(response.accessToken);
        this._currentUser.set(response.user);
      }),
      catchError(() => {
        this.tokenStorage.clearToken();
        this._currentUser.set(null);
        return of(null);
      })
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/v1/auth/logout', {}, { withCredentials: true }).pipe(
      tap(() => {
        this.tokenStorage.clearToken();
        this._currentUser.set(null);
        this.router.navigate(['/login']);
      }),
      catchError(() => {
        this.tokenStorage.clearToken();
        this._currentUser.set(null);
        this.router.navigate(['/login']);
        return of(void 0);
      })
    );
  }

  hasRole(role: UserRole): boolean {
    const user = this._currentUser();
    if (!user) return false;
    if (user.isPlatformAdmin) return true;
    return user.memberships.some((m) => m.role === role);
  }

  hasRoleOnStore(storeSlug: string, role: UserRole): boolean {
    const user = this._currentUser();
    if (!user) return false;
    if (user.isPlatformAdmin) return true;
    return user.memberships.some((m) => m.storeSlug === storeSlug && m.role === role);
  }
}
