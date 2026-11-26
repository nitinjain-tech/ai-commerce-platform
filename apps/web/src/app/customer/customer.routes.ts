import { Routes } from '@angular/router';
import { CustomerLayoutComponent } from './layout/customer-layout.component';
import { CustomerDashboardComponent } from './dashboard/customer-dashboard.component';
import { authGuard } from '../core/guards/auth.guard';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    component: CustomerLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        component: CustomerDashboardComponent,
      },
    ],
  },
];
