import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { TokenStorageService } from '../services/token-storage.service';
import { TenantContextService } from '../services/tenant-context.service';
import { environment } from '../../../environments/environment';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const tokenStorage = inject(TokenStorageService);
  const authService = inject(AuthService);
  const tenantContext = inject(TenantContextService);

  const token = tokenStorage.getToken();
  const activeSlug = tenantContext.activeStoreSlug();

  let headers = req.headers;
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }
  if (activeSlug && !headers.has('X-Tenant-Slug')) {
    headers = headers.set('X-Tenant-Slug', activeSlug);
  }

  const apiUrl =
    environment.apiUrl && (req.url.startsWith('/api') || req.url.startsWith('/uploads'))
      ? `${environment.apiUrl}${req.url}`
      : req.url;

  const authReq = req.clone({ url: apiUrl, headers });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 encountered on protected routes (not auth endpoints), attempt silent token refresh once
      if (
        error.status === 401 &&
        !req.url.includes('/api/v1/auth/login') &&
        !req.url.includes('/api/v1/auth/refresh') &&
        !isRefreshing
      ) {
        isRefreshing = true;
        return authService.refreshSession().pipe(
          switchMap((response) => {
            isRefreshing = false;
            if (response && response.accessToken) {
              const retryReq = authReq.clone({
                setHeaders: {
                  Authorization: `Bearer ${response.accessToken}`
                }
              });
              return next(retryReq);
            }
            return throwError(() => error);
          }),
          catchError((refreshErr) => {
            isRefreshing = false;
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
