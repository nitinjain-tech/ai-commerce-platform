import { Routes } from '@angular/router';

export const routes: Routes = [
  // 1. Customer Area (lazy-loaded)
  {
    path: 'account',
    loadChildren: () =>
      import('./customer/customer.routes').then((m) => m.CUSTOMER_ROUTES),
  },
  // 2. Store Admin Area (lazy-loaded, store-scoped)
  {
    path: 'admin/:storeSlug',
    loadChildren: () =>
      import('./store-admin/store-admin.routes').then((m) => m.STORE_ADMIN_ROUTES),
  },
  // 3. Platform Admin Area (lazy-loaded, cross-tenant)
  {
    path: 'platform',
    loadChildren: () =>
      import('./platform-admin/platform-admin.routes').then((m) => m.PLATFORM_ADMIN_ROUTES),
  },
  // Status pages
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./shared/status-pages/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  // 4. Storefront Area (lazy-loaded, public)
  {
    path: '',
    loadChildren: () =>
      import('./storefront/storefront.routes').then((m) => m.STOREFRONT_ROUTES),
  },
  // Catch-all
  {
    path: '**',
    loadComponent: () =>
      import('./shared/status-pages/not-found.component').then((m) => m.NotFoundComponent),
  },
];
