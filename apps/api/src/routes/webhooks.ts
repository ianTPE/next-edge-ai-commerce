import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { orders, orderItems, products } from '@repo/db/schema';
import { getDatabase } from '../lib/db';
import type { Env } from '../types';

export const webhooksRoutes = new Hono<{ Bindings: Env }>();

// POST /api/webhook/stripe - Handle Stripe webhooks
webhooksRoutes.post('/stripe', async (c) => {
  const { db } = getDatabase(c.env);

  // Get raw body for signature verification
  const rawBody = await c.req.text();
  const signature = c.req.header('stripe-signature');

  if (!signature) {
    return c.json({ ok: false, error: { code: 'INVALID_SIGNATURE', message: 'Missing signature' } }, 400);
  }

  // TODO: Verify Stripe signature
  // const stripe = new Stripe(c.env.STRIPE_SECRET_KEY);
  // const event = stripe.webhooks.constructEvent(rawBody, signature, c.env.STRIPE_WEBHOOK_SECRET);

  // For now, parse the body directly (NOT SAFE FOR PRODUCTION)
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return c.json({ ok: false, error: { code: 'INVALID_PAYLOAD', message: 'Invalid JSON' } }, 400);
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Check if order already exists (idempotency)
    const existing = await db
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, session.id))
      .get();

    if (existing) {
      // Already processed
      return c.json({ ok: true, data: { message: 'Already processed' } });
    }

    const now = new Date();
    const orderId = crypto.randomUUID();

    // Create order
    await db.insert(orders).values({
      id: orderId,
      stripeSessionId: session.id,
      customerEmail: session.customer_email || session.customer_details?.email || 'unknown@example.com',
      customerName: session.customer_details?.name,
      currency: session.currency?.toUpperCase() || 'TWD',
      totalAmountCents: session.amount_total || 0,
      status: 'paid',
      shippingAddressJson: session.shipping_details ? JSON.stringify(session.shipping_details) : null,
      createdAt: now,
      updatedAt: now,
    });

    // Create order items from line items (if available in metadata)
    // In production, you'd store cart info in session metadata or retrieve line items from Stripe
    if (session.metadata?.cartItems) {
      try {
        const cartItems = JSON.parse(session.metadata.cartItems);
        for (const item of cartItems) {
          await db.insert(orderItems).values({
            id: crypto.randomUUID(),
            orderId,
            productId: item.productId,
            sku: item.sku,
            productName: item.productName,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          });

          // Optionally: Decrement stock
          const product = await db.select().from(products).where(eq(products.id, item.productId)).get();
          if (product) {
            await db
              .update(products)
              .set({
                stockQuantity: Math.max(0, product.stockQuantity - item.quantity),
                updatedAt: now,
              })
              .where(eq(products.id, item.productId));
          }
        }
      } catch (e) {
        console.error('Failed to parse cart items:', e);
      }
    }

    return c.json({ ok: true, data: { orderId } });
  }

  // Handle other events as needed
  return c.json({ ok: true, data: { message: 'Event received' } });
});
