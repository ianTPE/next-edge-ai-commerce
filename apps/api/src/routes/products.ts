import { Hono } from 'hono';
import { eq, desc, asc, like, and, lt } from 'drizzle-orm';
import { products, productImages } from '@repo/db/schema';
import { getDatabase } from '../lib/db';
import { requireAuth } from '../middlewares/auth';
import { notFound, validationError } from '../lib/errors';
import {
  createProductSchema,
  updateProductSchema,
  validateCartSchema,
  paginationSchema,
} from '../lib/validators';
import type { Env, PaginatedResponse, CartValidationResult, ValidatedCartItem } from '../types';

export const productsRoutes = new Hono<{ Bindings: Env }>();

// ===========================================
// Public Routes
// ===========================================

// GET /api/products - List active products (public)
productsRoutes.get('/', async (c) => {
  const { db } = getDatabase(c.env);
  const query = c.req.query();

  const { page, pageSize, sort } = paginationSchema.parse(query);
  const offset = (page - 1) * pageSize;

  // Determine sort order
  let orderBy = desc(products.createdAt);
  if (sort === 'price_asc') orderBy = asc(products.priceCents);
  if (sort === 'price_desc') orderBy = desc(products.priceCents);
  if (sort === 'name_asc') orderBy = asc(products.name);

  const items = await db
    .select()
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  const countResult = await db
    .select({ count: products.id })
    .from(products)
    .where(eq(products.isActive, true));

  const total = countResult.length;

  const response: PaginatedResponse<typeof items[0]> = {
    items,
    page,
    pageSize,
    total,
  };

  return c.json({ ok: true, data: response });
});

// GET /api/products/search - Search products (public)
productsRoutes.get('/search', async (c) => {
  const { db } = getDatabase(c.env);
  const q = c.req.query('q') || '';

  const items = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), like(products.name, `%${q}%`)))
    .limit(20);

  return c.json({ ok: true, data: { items } });
});

// GET /api/products/:slug - Get product by slug (public)
productsRoutes.get('/:slug', async (c) => {
  const { db } = getDatabase(c.env);
  const slug = c.req.param('slug');

  const product = await db.select().from(products).where(eq(products.slug, slug)).get();

  if (!product) {
    return notFound(c, 'Product not found');
  }

  // Get product images
  const images = await db
    .select()
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));

  return c.json({ ok: true, data: { ...product, images } });
});

// POST /api/products/validate-cart - Validate cart items (public)
productsRoutes.post('/validate-cart', async (c) => {
  const { db } = getDatabase(c.env);
  const body = await c.req.json();

  const parsed = validateCartSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, 'Invalid cart data', parsed.error.flatten());
  }

  const { items } = parsed.data;
  const validatedItems: ValidatedCartItem[] = [];
  const errors: string[] = [];

  for (const item of items) {
    const product = await db.select().from(products).where(eq(products.sku, item.sku)).get();

    if (!product) {
      errors.push(`Product with SKU ${item.sku} not found`);
      continue;
    }

    if (!product.isActive) {
      errors.push(`Product ${product.name} is not available`);
      continue;
    }

    if (product.stockQuantity < item.quantity) {
      errors.push(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
    }

    validatedItems.push({
      sku: product.sku,
      available: product.stockQuantity,
      unitPriceCents: product.priceCents,
      productId: product.id,
      productName: product.name,
    });
  }

  const result: CartValidationResult = {
    isValid: errors.length === 0,
    items: validatedItems,
    ...(errors.length > 0 && { errors }),
  };

  return c.json({ ok: true, data: result });
});

// ===========================================
// Admin Routes (require auth)
// ===========================================

// GET /api/products/all - List all products including inactive (admin)
productsRoutes.get('/all', requireAuth, async (c) => {
  const { db } = getDatabase(c.env);
  const query = c.req.query();

  const { page, pageSize } = paginationSchema.parse(query);
  const offset = (page - 1) * pageSize;

  const items = await db
    .select()
    .from(products)
    .orderBy(desc(products.updatedAt))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db.select({ count: products.id }).from(products);
  const total = countResult.length;

  return c.json({ ok: true, data: { items, page, pageSize, total } });
});

// GET /api/products/low-stock - Get low stock products (admin)
productsRoutes.get('/low-stock', requireAuth, async (c) => {
  const { db } = getDatabase(c.env);
  const threshold = parseInt(c.req.query('threshold') || '10', 10);

  const items = await db
    .select()
    .from(products)
    .where(and(eq(products.isActive, true), lt(products.stockQuantity, threshold)))
    .orderBy(asc(products.stockQuantity));

  return c.json({ ok: true, data: { items, threshold } });
});

// POST /api/products - Create product (admin)
productsRoutes.post('/', requireAuth, async (c) => {
  const { db } = getDatabase(c.env);
  const body = await c.req.json();

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, 'Invalid product data', parsed.error.flatten());
  }

  const now = new Date();
  const id = crypto.randomUUID();

  await db.insert(products).values({
    id,
    ...parsed.data,
    createdAt: now,
    updatedAt: now,
  });

  const product = await db.select().from(products).where(eq(products.id, id)).get();

  return c.json({ ok: true, data: product }, 201);
});

// PUT /api/products/:id - Update product (admin)
productsRoutes.put('/:id', requireAuth, async (c) => {
  const { db } = getDatabase(c.env);
  const id = c.req.param('id');
  const body = await c.req.json();

  const existing = await db.select().from(products).where(eq(products.id, id)).get();
  if (!existing) {
    return notFound(c, 'Product not found');
  }

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, 'Invalid product data', parsed.error.flatten());
  }

  await db
    .update(products)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  const updated = await db.select().from(products).where(eq(products.id, id)).get();

  return c.json({ ok: true, data: updated });
});

// DELETE /api/products/:id - Soft delete product (admin)
productsRoutes.delete('/:id', requireAuth, async (c) => {
  const { db } = getDatabase(c.env);
  const id = c.req.param('id');

  const existing = await db.select().from(products).where(eq(products.id, id)).get();
  if (!existing) {
    return notFound(c, 'Product not found');
  }

  // Soft delete by setting isActive to false
  await db
    .update(products)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id));

  return c.json({ ok: true, data: { message: 'Product deleted' } });
});
