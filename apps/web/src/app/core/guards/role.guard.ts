import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

export function roleGuard(...requiredRoles: UserRole[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();
    if (!user) {
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    // Platform admin has universal platform access
    if (user.isPlatformAdmin) {
      return true;
    }

    // If requiring platform_admin specifically and user is not
    if (requiredRoles.includes('platform_admin') && !user.isPlatformAdmin) {
      return router.createUrlTree(['/forbidden']);
    }

    // Check store-specific role if route includes :storeSlug
    const storeSlug = route.paramMap.get('storeSlug');
    if (storeSlug) {
      const hasStoreRole = requiredRoles.some((role) =>
        authService.hasRoleOnStore(storeSlug, role)
      );
      if (hasStoreRole) {
        return true;
      }
      return router.createUrlTree(['/forbidden']);
    }

    // General role check across any membership
    const hasRole = requiredRoles.some((role) => authService.hasRole(role));
    if (hasRole) {
      return true;
    }

    return router.createUrlTree(['/forbidden']);
  };
}
