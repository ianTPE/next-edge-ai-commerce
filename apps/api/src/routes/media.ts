import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { productImages } from '@repo/db/schema';
import { getDatabase } from '../lib/db';
import { requireAuth } from '../middlewares/auth';
import { validationError } from '../lib/errors';
import { signedUploadSchema, commitMediaSchema } from '../lib/validators';
import type { Env } from '../types';

export const mediaRoutes = new Hono<{ Bindings: Env }>();

// All media routes require admin auth
mediaRoutes.use('*', requireAuth);

// POST /api/media/signed-upload - Get signed upload URL (admin)
mediaRoutes.post('/signed-upload', async (c) => {
  const body = await c.req.json();

  const parsed = signedUploadSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, 'Invalid upload request', parsed.error.flatten());
  }

  const { filename, contentType } = parsed.data;

  // Generate unique key for R2
  const key = `products/${Date.now()}-${crypto.randomUUID()}-${filename}`;

  // TODO: Generate signed URL for R2 upload
  // For now, return a placeholder
  // In production, use R2's createMultipartUpload or presigned URL

  return c.json({
    ok: true,
    data: {
      uploadUrl: `https://placeholder-r2-upload-url/${key}`,
      key,
      publicUrl: `${c.env.R2_PUBLIC_BASE_URL || 'https://r2.example.com'}/${key}`,
    },
  });
});

// POST /api/media/commit - Commit uploaded file metadata (admin)
mediaRoutes.post('/commit', async (c) => {
  const { db } = getDatabase(c.env);
  const body = await c.req.json();

  const parsed = commitMediaSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(c, 'Invalid commit request', parsed.error.flatten());
  }

  const { productId, url, sortOrder } = parsed.data;
  const id = crypto.randomUUID();
  const now = new Date();

  await db.insert(productImages).values({
    id,
    productId,
    url,
    sortOrder,
    createdAt: now,
  });

  const image = await db.select().from(productImages).where(eq(productImages.id, id)).get();

  return c.json({ ok: true, data: image }, 201);
});
