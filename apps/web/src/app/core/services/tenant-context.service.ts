import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Tenant } from '../models/tenant.models';
import { Observable, tap, catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TenantContextService {
  private readonly http = inject(HttpClient);
  
  private readonly _currentTenant = signal<Tenant | null>(null);
  readonly currentTenant = this._currentTenant.asReadonly();

  private readonly _activeStoreSlug = signal<string>(this.determineInitialSlug());
  readonly activeStoreSlug = this._activeStoreSlug.asReadonly();

  private determineInitialSlug(): string {
    if (typeof window !== 'undefined') {
      // 1. Check URL query parameters: ?store=slug or ?tenant=slug
      const urlParams = new URLSearchParams(window.location.search);
      const querySlug = urlParams.get('store') || urlParams.get('tenant');
      if (querySlug) {
        const clean = querySlug.toLowerCase().trim();
        localStorage.setItem('preferred_store_slug', clean);
        return clean;
      }

      // 2. Check Subdomain (e.g. store1.localhost:4200)
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      if (parts.length > 1 && !['localhost', '127', 'www', 'api', 'platform'].includes(parts[0])) {
        return parts[0];
      }

      // 3. Check LocalStorage
      const stored = localStorage.getItem('preferred_store_slug');
      if (stored) {
        return stored;
      }
    }
    return 'apex-athletics';
  }

  setActiveStoreSlug(slug: string): void {
    this._activeStoreSlug.set(slug);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_store_slug', slug);
    }
    this.loadCurrentTenant(slug).subscribe();
  }

  loadCurrentTenant(slug?: string): Observable<Tenant | null> {
    const targetSlug = slug || this._activeStoreSlug();
    return this.http.get<Tenant>(`/api/v1/tenants/${targetSlug}`).pipe(
      tap((tenant) => this._currentTenant.set(tenant)),
      catchError(() => {
        // Fallback to /tenants/current if slug lookup fails
        return this.http.get<Tenant>('/api/v1/tenants/current').pipe(
          tap((tenant) => this._currentTenant.set(tenant)),
          catchError(() => {
            this._currentTenant.set(null);
            return of(null);
          })
        );
      })
    );
  }

  setTenant(tenant: Tenant | null): void {
    this._currentTenant.set(tenant);
  }
}
