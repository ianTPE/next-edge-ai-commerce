import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@repo/db/schema';

export type DbType = 'd1' | 'neon';

export function getDatabase(env: { DB: D1Database }) {
  const db = drizzle(env.DB, { schema });
  return { db, type: 'd1' as DbType };
}

export type Database = ReturnType<typeof getDatabase>['db'];
