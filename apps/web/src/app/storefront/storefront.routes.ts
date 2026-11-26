import { Routes } from '@angular/router';
import { StorefrontLayoutComponent } from './layout/storefront-layout.component';
import { StorefrontHomeComponent } from './home/storefront-home.component';
import { ProductDetailComponent } from './product-detail/product-detail.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { guestGuard } from '../core/guards/guest.guard';

export const STOREFRONT_ROUTES: Routes = [
  {
    path: '',
    component: StorefrontLayoutComponent,
    children: [
      {
        path: '',
        component: StorefrontHomeComponent,
      },
      {
        path: 'products/:slug',
        component: ProductDetailComponent,
      },
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [guestGuard],
      },
      {
        path: 'register',
        component: RegisterComponent,
        canActivate: [guestGuard],
      },
    ],
  },
];
