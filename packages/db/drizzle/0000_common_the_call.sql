CREATE TABLE `action_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`action_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`before_json` text,
	`after_json` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`action_id`) REFERENCES `action_log`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `action_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_type` text NOT NULL,
	`actor_id` text,
	`channel` text NOT NULL,
	`intent` text NOT NULL,
	`prompt` text,
	`tool_calls_json` text,
	`status` text DEFAULT 'proposed' NOT NULL,
	`created_at` integer NOT NULL,
	`executed_at` integer
);
--> statement-breakpoint
CREATE TABLE `auth_session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_session_token_unique` ON `auth_session` (`token`);--> statement-breakpoint
CREATE TABLE `auth_user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'admin' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_user_email_unique` ON `auth_user` (`email`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`sku` text NOT NULL,
	`product_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`stripe_session_id` text,
	`customer_email` text NOT NULL,
	`customer_name` text,
	`currency` text DEFAULT 'TWD' NOT NULL,
	`total_amount_cents` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`shipping_address_json` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_stripe_session_id_unique` ON `orders` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sku` text NOT NULL,
	`description` text,
	`price_cents` integer NOT NULL,
	`compare_at_price_cents` integer,
	`stock_quantity` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);