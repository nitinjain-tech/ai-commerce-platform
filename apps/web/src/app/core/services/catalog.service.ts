import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  ProductCreateRequest,
  ProductDetail,
  ProductImage,
  ProductImageCreateRequest,
  ProductListItem,
  ProductUpdateRequest,
  ProductVariant,
  ProductVariantCreateRequest,
} from '../models/catalog.models';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  // -------------------------------------------------------------
  // Storefront Public APIs
  // -------------------------------------------------------------

  getCategories(storeSlug?: string): Observable<Category[]> {
    let params = new HttpParams();
    if (storeSlug) {
      params = params.set('storeSlug', storeSlug);
    }
    return this.http.get<Category[]>(`${this.baseUrl}/catalog/categories`, { params });
  }

  getProducts(filters?: {
    storeSlug?: string;
    categoryId?: string;
    categorySlug?: string;
    isFeatured?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
  }): Observable<ProductListItem[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.storeSlug) params = params.set('storeSlug', filters.storeSlug);
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
      if (filters.categorySlug) params = params.set('categorySlug', filters.categorySlug);
      if (filters.isFeatured !== undefined) params = params.set('isFeatured', filters.isFeatured.toString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.skip !== undefined) params = params.set('skip', filters.skip.toString());
      if (filters.limit !== undefined) params = params.set('limit', filters.limit.toString());
    }
    return this.http.get<ProductListItem[]>(`${this.baseUrl}/catalog/products`, { params });
  }

  getProductBySlug(slug: string, storeSlug?: string): Observable<ProductDetail> {
    let params = new HttpParams();
    if (storeSlug) {
      params = params.set('storeSlug', storeSlug);
    }
    return this.http.get<ProductDetail>(`${this.baseUrl}/catalog/products/${slug}`, { params });
  }

  // -------------------------------------------------------------
  // Store Admin APIs
  // -------------------------------------------------------------

  adminGetCategories(storeSlug: string): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/admin/stores/${storeSlug}/catalog/categories`);
  }

  adminCreateCategory(storeSlug: string, data: CategoryCreateRequest): Observable<Category> {
    return this.http.post<Category>(`${this.baseUrl}/admin/stores/${storeSlug}/catalog/categories`, data);
  }

  adminUpdateCategory(storeSlug: string, categoryId: string, data: CategoryUpdateRequest): Observable<Category> {
    return this.http.put<Category>(`${this.baseUrl}/admin/stores/${storeSlug}/catalog/categories/${categoryId}`, data);
  }

  adminDeleteCategory(storeSlug: string, categoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/stores/${storeSlug}/catalog/categories/${categoryId}`);
  }

  adminGetProducts(
    storeSlug: string,
    filters?: { categoryId?: string; search?: string; skip?: number; limit?: number }
  ): Observable<ProductListItem[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.skip !== undefined) params = params.set('skip', filters.skip.toString());
      if (filters.limit !== undefined) params = params.set('limit', filters.limit.toString());
    }
    return this.http.get<ProductListItem[]>(`${this.baseUrl}/admin/stores/${storeSlug}/catalog/products`, { params });
  }

  adminGetProduct(storeSlug: string, productId: string): Observable<ProductDetail> {
    return this.http.get<ProductDetail>(`${this.baseUrl}/admin/stores/${storeSlug}/catalog/products/${productId}`);
  }

  adminCreateProduct(storeSlug: string, data: ProductCreateRequest): Observable<ProductDetail> {
    return this.http.post<ProductDetail>(`${this.baseUrl}/admin/stores/${storeSlug}/catalog/products`, data);
  }

  adminUpdateProduct(storeSlug: string, productId: string, data: ProductUpdateRequest): Observable<ProductDetail> {
    return this.http.put<ProductDetail>(`${this.baseUrl}/admin/stores/${storeSlug}/catalog/products/${productId}`, data);
  }

  adminDeleteProduct(storeSlug: string, productId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/admin/stores/${storeSlug}/catalog/products/${productId}`);
  }

  adminAddVariant(storeSlug: string, productId: string, data: ProductVariantCreateRequest): Observable<ProductVariant> {
    return this.http.post<ProductVariant>(`${this.baseUrl}/admin/stores/${storeSlug}/catalog/products/${productId}/variants`, data);
  }

  adminAddImage(storeSlug: string, productId: string, data: ProductImageCreateRequest): Observable<ProductImage> {
    return this.http.post<ProductImage>(`${this.baseUrl}/admin/stores/${storeSlug}/catalog/products/${productId}/images`, data);
  }

  adminUploadMedia(storeSlug: string, file: File): Observable<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string; filename: string }>(`${this.baseUrl}/admin/stores/${storeSlug}/storage/upload`, formData);
  }
}
