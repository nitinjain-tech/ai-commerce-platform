export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  description?: string | null;
  currency?: string;
  logoUrl?: string | null;
  logo_url?: string | null;
  isActive?: boolean;
  is_active?: boolean;
}
