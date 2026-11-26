import { Routes } from '@angular/router';
import { StoreAdminLayoutComponent } from './layout/store-admin-layout.component';
import { StoreAdminDashboardComponent } from './dashboard/store-admin-dashboard.component';
import { StoreAdminProductListComponent } from './products/product-list.component';
import { StoreAdminProductFormComponent } from './products/product-form.component';
import { StoreAdminCategoryListComponent } from './categories/category-list.component';
import { authGuard } from '../core/guards/auth.guard';
import { roleGuard } from '../core/guards/role.guard';

export const STORE_ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: StoreAdminLayoutComponent,
    canActivate: [authGuard, roleGuard('store_admin', 'store_staff')],
    children: [
      {
        path: '',
        component: StoreAdminDashboardComponent,
      },
      {
        path: 'products',
        component: StoreAdminProductListComponent,
      },
      {
        path: 'products/new',
        component: StoreAdminProductFormComponent,
      },
      {
        path: 'products/:id/edit',
        component: StoreAdminProductFormComponent,
      },
      {
        path: 'categories',
        component: StoreAdminCategoryListComponent,
      },
    ],
  },
];
