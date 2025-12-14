import { createMiddleware } from 'hono/factory';
import type { Env } from '../types';
import { unauthorized } from '../lib/errors';

export const requireAuth = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  // TODO: Implement Better Auth session validation
  // For now, check for session cookie existence
  const sessionCookie = c.req.header('cookie')?.includes(c.env.AUTH_COOKIE_NAME);

  if (!sessionCookie) {
    return unauthorized(c, 'Authentication required');
  }

  // TODO: Validate session with Better Auth
  // const session = await validateSession(c.env, sessionCookie);
  // if (!session) {
  //   return unauthorized(c, 'Invalid session');
  // }
  // c.set('session', session);

  await next();
});

export const optionalAuth = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  // TODO: Implement optional auth - set session if present but don't require it
  await next();
});
