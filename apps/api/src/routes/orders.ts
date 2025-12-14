import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import { orders, orderItems } from '@repo/db/schema';
import { getDatabase } from '../lib/db';
import { requireAuth } from '../middlewares/auth';
import { notFound } from '../lib/errors';
import { paginationSchema } from '../lib/validators';
import type { Env } from '../types';

export const ordersRoutes = new Hono<{ Bindings: Env }>();

// All order routes require admin auth
ordersRoutes.use('*', requireAuth);

// GET /api/orders - List orders (admin)
ordersRoutes.get('/', async (c) => {
  const { db } = getDatabase(c.env);
  const query = c.req.query();

  const { page, pageSize } = paginationSchema.parse(query);
  const offset = (page - 1) * pageSize;

  const items = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db.select({ count: orders.id }).from(orders);
  const total = countResult.length;

  return c.json({ ok: true, data: { items, page, pageSize, total } });
});

// GET /api/orders/dashboard - Dashboard stats (admin)
ordersRoutes.get('/dashboard', async (c) => {
  const { db } = getDatabase(c.env);

  // Get today's date range (UTC)
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  // Total orders count
  const totalOrders = await db.select({ count: orders.id }).from(orders);

  // Paid orders
  const paidOrders = await db
    .select({ count: orders.id })
    .from(orders)
    .where(eq(orders.status, 'paid'));

  // Revenue (sum of paid orders)
  const revenueResult = await db
    .select({
      total: sql<number>`SUM(${orders.totalAmountCents})`,
    })
    .from(orders)
    .where(eq(orders.status, 'paid'));

  return c.json({
    ok: true,
    data: {
      totalOrders: totalOrders.length,
      paidOrders: paidOrders.length,
      totalRevenueCents: revenueResult[0]?.total || 0,
      timestamp: Date.now(),
    },
  });
});

// GET /api/orders/stats - Revenue stats (admin)
ordersRoutes.get('/stats', async (c) => {
  const { db } = getDatabase(c.env);

  // Get orders grouped by status
  const byStatus = await db
    .select({
      status: orders.status,
      count: sql<number>`COUNT(*)`,
      totalCents: sql<number>`SUM(${orders.totalAmountCents})`,
    })
    .from(orders)
    .groupBy(orders.status);

  return c.json({
    ok: true,
    data: {
      byStatus,
      timestamp: Date.now(),
    },
  });
});

// GET /api/orders/:id - Get order detail (admin)
ordersRoutes.get('/:id', async (c) => {
  const { db } = getDatabase(c.env);
  const id = c.req.param('id');

  const order = await db.select().from(orders).where(eq(orders.id, id)).get();

  if (!order) {
    return notFound(c, 'Order not found');
  }

  // Get order items
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));

  return c.json({
    ok: true,
    data: {
      ...order,
      items,
    },
  });
});
