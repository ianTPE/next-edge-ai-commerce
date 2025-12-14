import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { actionLog, actionChanges } from '@repo/db/schema';
import { getDatabase } from '../lib/db';
import { requireAuth } from '../middlewares/auth';
import { notFound, validationError } from '../lib/errors';
import { createActionSchema, paginationSchema } from '../lib/validators';
import type { Env } from '../types';

export const actionsRoutes = new Hono<{ Bindings: Env }>();

// All action routes require admin auth
actionsRoutes.use('*', requireAuth);

// GET /api/actions - List action logs (admin)
actionsRoutes.get('/', async (c) => {
  const { db } = getDatabase(c.env);
  const query = c.req.query();

  const { page, pageSize } = paginationSchema.parse(query);
  const offset = (page - 1) * pageSize;

  const items = await db
    .select()
    .from(actionLog)
    .orderBy(desc(actionLog.createdAt))
    .limit(pageSize)
    .offset(offset);

  const countResult = await db.select({ count: actionLog.id }).from(actionLog);
  const total = countResult.length;

  return c.json({ ok: true, data: { items, page, pageSize, total } });
});

// GET /api/actions/:id - Get action detail with changes (admin)
actionsRoutes.get('/:id', async (c) => {
  const { db } = getDatabase(c.env);
  const id = c.req.param('id');

  const action = await db.select().from(actionLog).where(eq(actionLog.id, id)).get();

  if (!action) {
    return notFound(c, 'Action not found');
  }

  // Get associated changes
  const changes = await db.select().from(actionChanges).where(eq(actionChanges.actionId, id));

  return c.json({
    ok: true,
    data: {
      ...action,
      changes,
    },
  });
});

// POST /api/actions - Create action log (admin/internal)
actionsRoutes.post('/', async (c) => {
  const { db } = getDatabase(c.env);
  const body = await c.req.json();

  const parsed = createActionSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, 'Invalid action data', parsed.error.flatten());
  }

  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(actionLog).values({
    id,
    ...parsed.data,
    createdAt: now,
  });

  const action = await db.select().from(actionLog).where(eq(actionLog.id, id)).get();

  return c.json({ ok: true, data: action }, 201);
});
