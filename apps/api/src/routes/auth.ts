import { Hono } from 'hono';
import type { Env } from '../types';

export const authRoutes = new Hono<{ Bindings: Env }>();

// TODO: Integrate Better Auth handlers
// Better Auth will handle these routes:
// POST /api/auth/sign-up
// POST /api/auth/sign-in
// POST /api/auth/sign-out
// GET  /api/auth/session

// Placeholder: Get current user
authRoutes.get('/me', async (c) => {
  // TODO: Return current user from session
  return c.json({
    ok: true,
    data: {
      user: null,
      message: 'Auth not yet implemented',
    },
  });
});
