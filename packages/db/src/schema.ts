import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ===========================================
// Auth Tables (Better Auth)
// ===========================================

export const authUser = sqliteTable('auth_user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const authSession = sqliteTable('auth_session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => authUser.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

// ===========================================
// Commerce Tables
// ===========================================

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  sku: text('sku').notNull().unique(),
  description: text('description'),
  priceCents: integer('price_cents').notNull(),
  compareAtPriceCents: integer('compare_at_price_cents'),
  stockQuantity: integer('stock_quantity').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const productImages = sqliteTable('product_images', {
  id: text('id').primaryKey(),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

// ===========================================
// Orders Tables
// ===========================================

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  stripeSessionId: text('stripe_session_id').unique(),
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name'),
  currency: text('currency').notNull().default('TWD'),
  totalAmountCents: integer('total_amount_cents').notNull(),
  status: text('status').notNull().default('pending'), // pending, paid, cancelled, refunded
  shippingAddressJson: text('shipping_address_json'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id),
  sku: text('sku').notNull(),
  productName: text('product_name').notNull(),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
});

// ===========================================
// Audit Tables (AI / Admin Operations)
// ===========================================

export const actionLog = sqliteTable('action_log', {
  id: text('id').primaryKey(),
  actorType: text('actor_type').notNull(), // 'human' | 'ai'
  actorId: text('actor_id'), // userId for human, model/agent id for ai
  channel: text('channel').notNull(), // 'web' | 'telegram' | 'slack'
  intent: text('intent').notNull(), // e.g., 'update_price', 'restock', 'generate_report'
  prompt: text('prompt'), // original input
  toolCallsJson: text('tool_calls_json'), // tool calling trace
  status: text('status').notNull().default('proposed'), // proposed, confirmed, executed, failed
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  executedAt: integer('executed_at', { mode: 'timestamp_ms' }),
});

export const actionChanges = sqliteTable('action_changes', {
  id: text('id').primaryKey(),
  actionId: text('action_id')
    .notNull()
    .references(() => actionLog.id, { onDelete: 'cascade' }),
  entityType: text('entity_type').notNull(), // 'product' | 'order' | ...
  entityId: text('entity_id').notNull(),
  beforeJson: text('before_json'),
  afterJson: text('after_json'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

// ===========================================
// Type Exports
// ===========================================

export type AuthUser = typeof authUser.$inferSelect;
export type NewAuthUser = typeof authUser.$inferInsert;

export type AuthSession = typeof authSession.$inferSelect;
export type NewAuthSession = typeof authSession.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type ActionLog = typeof actionLog.$inferSelect;
export type NewActionLog = typeof actionLog.$inferInsert;

export type ActionChange = typeof actionChanges.$inferSelect;
export type NewActionChange = typeof actionChanges.$inferInsert;
