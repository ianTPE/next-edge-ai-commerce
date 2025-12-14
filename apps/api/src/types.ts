export interface Env {
  // Cloudflare bindings
  DB: D1Database;
  R2: R2Bucket;

  // Auth
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  AUTH_COOKIE_NAME: string;
  ADMIN_ORIGIN: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;

  // Internal API (AI Gateway → API)
  INTERNAL_API_SECRET?: string;
}

// API Response types
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: { code: string; message: string; details?: unknown } };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
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
