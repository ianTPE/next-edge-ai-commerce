import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { products, actionLog, actionChanges } from '@repo/db/schema';
import { getDatabase } from '../lib/db';
import { requireAuth } from '../middlewares/auth';
import { notFound, validationError } from '../lib/errors';
import { updatePriceSchema, restockSchema } from '../lib/validators';
import type { Env } from '../types';

export const toolsRoutes = new Hono<{ Bindings: Env }>();

// All tool routes require admin auth
toolsRoutes.use('*', requireAuth);

// POST /api/tools/update-price - Update product price (AI tool)
toolsRoutes.post('/update-price', async (c) => {
  const { db } = getDatabase(c.env);
  const body = await c.req.json();

  const parsed = updatePriceSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, 'Invalid price update data', parsed.error.flatten());
  }

  const { productId, newPriceCents } = parsed.data;

  // Get current product
  const product = await db.select().from(products).where(eq(products.id, productId)).get();

  if (!product) {
    return notFound(c, 'Product not found');
  }

  const now = new Date();
  const oldPriceCents = product.priceCents;

  // Update price
  await db
    .update(products)
    .set({
      priceCents: newPriceCents,
      updatedAt: now,
    })
    .where(eq(products.id, productId));

  // Create audit log
  const actionId = crypto.randomUUID();
  await db.insert(actionLog).values({
    id: actionId,
    actorType: 'ai',
    actorId: null,
    channel: 'web',
    intent: 'update_price',
    status: 'executed',
    createdAt: now,
    executedAt: now,
  });

  // Record change
  await db.insert(actionChanges).values({
    id: crypto.randomUUID(),
    actionId,
    entityType: 'product',
    entityId: productId,
    beforeJson: JSON.stringify({ priceCents: oldPriceCents }),
    afterJson: JSON.stringify({ priceCents: newPriceCents }),
    createdAt: now,
  });

  const updated = await db.select().from(products).where(eq(products.id, productId)).get();

  return c.json({
    ok: true,
    data: {
      product: updated,
      change: {
        oldPriceCents,
        newPriceCents,
      },
    },
  });
});

// POST /api/tools/restock - Restock product inventory (AI tool)
toolsRoutes.post('/restock', async (c) => {
  const { db } = getDatabase(c.env);
  const body = await c.req.json();

  const parsed = restockSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, 'Invalid restock data', parsed.error.flatten());
  }

  const { productId, quantity } = parsed.data;

  // Get current product
  const product = await db.select().from(products).where(eq(products.id, productId)).get();

  if (!product) {
    return notFound(c, 'Product not found');
  }

  const now = new Date();
  const oldQuantity = product.stockQuantity;
  const newQuantity = oldQuantity + quantity;

  // Update stock
  await db
    .update(products)
    .set({
      stockQuantity: newQuantity,
      updatedAt: now,
    })
    .where(eq(products.id, productId));

  // Create audit log
  const actionId = crypto.randomUUID();
  await db.insert(actionLog).values({
    id: actionId,
    actorType: 'ai',
    actorId: null,
    channel: 'web',
    intent: 'restock',
    status: 'executed',
    createdAt: now,
    executedAt: now,
  });

  // Record change
  await db.insert(actionChanges).values({
    id: crypto.randomUUID(),
    actionId,
    entityType: 'product',
    entityId: productId,
    beforeJson: JSON.stringify({ stockQuantity: oldQuantity }),
    afterJson: JSON.stringify({ stockQuantity: newQuantity }),
    createdAt: now,
  });

  const updated = await db.select().from(products).where(eq(products.id, productId)).get();

  return c.json({
    ok: true,
    data: {
      product: updated,
      change: {
        oldQuantity,
        addedQuantity: quantity,
        newQuantity,
      },
    },
  });
});
