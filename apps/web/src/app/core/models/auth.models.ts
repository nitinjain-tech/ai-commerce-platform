export type UserRole = 'customer' | 'store_admin' | 'store_staff' | 'platform_admin';

export interface StoreMembership {
  storeId: string;
  storeSlug: string;
  storeName?: string;
  role: UserRole;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  isActive: boolean;
  isPlatformAdmin: boolean;
  memberships: StoreMembership[];
}

export interface AuthResponse {
  accessToken: string;
  expiresInSeconds: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
  storeSlug?: string;
}
