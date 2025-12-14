import { z } from 'zod';

// Product validators
export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/),
  sku: z.string().min(1).max(100),
  description: z.string().optional(),
  priceCents: z.number().int().positive(),
  compareAtPriceCents: z.number().int().positive().optional(),
  stockQuantity: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateProductSchema = createProductSchema.partial();

// Cart validation
export const cartItemSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const validateCartSchema = z.object({
  items: z.array(cartItemSchema).min(1),
});

// Order validators
export const orderStatusSchema = z.enum(['pending', 'paid', 'cancelled', 'refunded']);

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
});

// Media
export const signedUploadSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

export const commitMediaSchema = z.object({
  productId: z.string().uuid(),
  url: z.string().url(),
  sortOrder: z.number().int().min(0).default(0),
});

// Action log
export const createActionSchema = z.object({
  actorType: z.enum(['human', 'ai']),
  actorId: z.string().optional(),
  channel: z.enum(['web', 'telegram', 'slack']),
  intent: z.string().min(1),
  prompt: z.string().optional(),
  toolCallsJson: z.string().optional(),
  status: z.enum(['proposed', 'confirmed', 'executed', 'failed']).default('proposed'),
});

// AI Tools
export const updatePriceSchema = z.object({
  productId: z.string().uuid(),
  newPriceCents: z.number().int().positive(),
});

export const restockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
});
