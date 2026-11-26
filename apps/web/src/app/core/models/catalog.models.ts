export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  parentId?: string | null;
  parent_id?: string | null;
  isActive: boolean;
  is_active?: boolean;
  sortOrder: number;
  sort_order?: number;
}

export interface CategoryCreateRequest {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CategoryUpdateRequest {
  name?: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface ProductVariant {
  id: string;
  productId?: string;
  product_id?: string;
  sku: string;
  name: string;
  price?: number | null;
  inventoryQuantity: number;
  inventory_quantity?: number;
  isActive: boolean;
  is_active?: boolean;
}

export interface ProductVariantCreateRequest {
  sku: string;
  name: string;
  price?: number | null;
  inventoryQuantity: number;
  isActive?: boolean;
}

export interface ProductImage {
  id: string;
  productId?: string;
  product_id?: string;
  url: string;
  altText?: string | null;
  alt_text?: string | null;
  sortOrder: number;
  sort_order?: number;
  isThumbnail: boolean;
  is_thumbnail?: boolean;
}

export interface ProductImageCreateRequest {
  url: string;
  altText?: string;
  sortOrder?: number;
  isThumbnail?: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  base_price?: number;
  compareAtPrice?: number | null;
  compare_at_price?: number | null;
  currency: string;
  categoryId?: string | null;
  category_id?: string | null;
  categoryName?: string | null;
  category_name?: string | null;
  thumbnailUrl?: string | null;
  thumbnail_url?: string | null;
  totalInventory: number;
  total_inventory?: number;
  isActive: boolean;
  is_active?: boolean;
  isFeatured: boolean;
  is_featured?: boolean;
}

export interface ProductDetail extends ProductListItem {
  category?: Category | null;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface ProductCreateRequest {
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  compareAtPrice?: number | null;
  currency?: string;
  categoryId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
  variants?: ProductVariantCreateRequest[];
  images?: ProductImageCreateRequest[];
}

export interface ProductUpdateRequest {
  name?: string;
  slug?: string;
  description?: string;
  basePrice?: number;
  compareAtPrice?: number | null;
  currency?: string;
  categoryId?: string | null;
  isActive?: boolean;
  isFeatured?: boolean;
}
