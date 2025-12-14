import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { productsRoutes } from './routes/products';
import { ordersRoutes } from './routes/orders';
import { authRoutes } from './routes/auth';
import { mediaRoutes } from './routes/media';
import { webhooksRoutes } from './routes/webhooks';
import { actionsRoutes } from './routes/actions';
import { toolsRoutes } from './routes/tools';

import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowedOrigins = [
        c.env.ADMIN_ORIGIN,
        'http://localhost:5173',
        'http://localhost:3000',
      ].filter(Boolean);
      return allowedOrigins.includes(origin) ? origin : '';
    },
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);

// Health check
app.get('/api/health', (c) => {
  return c.json({ ok: true, timestamp: Date.now() });
});

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/products', productsRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/media', mediaRoutes);
app.route('/api/webhook', webhooksRoutes);
app.route('/api/actions', actionsRoutes);
app.route('/api/tools', toolsRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ ok: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: err.message || 'Internal server error',
      },
    },
    500
  );
});

export default app;
