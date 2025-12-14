const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: { code: string; message: string };
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    console.error('API request failed:', error);
    return {
      ok: false,
      error: { code: 'NETWORK_ERROR', message: 'Network request failed' },
    };
  }
}

// Products API
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stockQuantity: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  sortOrder: number;
}

export interface PaginatedProducts {
  items: Product[];
  page: number;
  pageSize: number;
  total: number;
}

export async function getProducts(params?: {
  page?: number;
  pageSize?: number;
  sort?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.sort) searchParams.set('sort', params.sort);

  const query = searchParams.toString();
  return fetchApi<PaginatedProducts>(`/api/products${query ? `?${query}` : ''}`);
}

export async function getProductBySlug(slug: string) {
  return fetchApi<Product>(`/api/products/${slug}`);
}

export async function searchProducts(q: string) {
  return fetchApi<{ items: Product[] }>(`/api/products/search?q=${encodeURIComponent(q)}`);
}

// Cart validation
export interface CartItem {
  sku: string;
  quantity: number;
}

export interface ValidatedCartItem {
  sku: string;
  available: number;
  unitPriceCents: number;
  productId: string;
  productName: string;
}

export interface CartValidationResult {
  isValid: boolean;
  items: ValidatedCartItem[];
  errors?: string[];
}

export async function validateCart(items: CartItem[]) {
  return fetchApi<CartValidationResult>('/api/products/validate-cart', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}
