import { Routes } from '@angular/router';
import { PlatformAdminLayoutComponent } from './layout/platform-admin-layout.component';
import { PlatformAdminDashboardComponent } from './dashboard/platform-admin-dashboard.component';
import { authGuard } from '../core/guards/auth.guard';
import { roleGuard } from '../core/guards/role.guard';

export const PLATFORM_ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: PlatformAdminLayoutComponent,
    canActivate: [authGuard, roleGuard('platform_admin')],
    children: [
      {
        path: '',
        component: PlatformAdminDashboardComponent,
      },
    ],
  },
];
