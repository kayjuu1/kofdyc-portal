CREATE TABLE `featured_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer,
	`display_title` text NOT NULL,
	`artwork_url` text NOT NULL,
	`target_date` text NOT NULL,
	`cta_label` text DEFAULT 'Event details' NOT NULL,
	`cta_url` text,
	`support_line` text,
	`is_active` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_by` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hierarchy_leaders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`node_id` integer NOT NULL,
	`name` text NOT NULL,
	`role_title` text NOT NULL,
	`photo_url` text,
	`phone` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`node_id`) REFERENCES `hierarchy_nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `hierarchy_nodes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parent_id` integer,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`crest_url` text,
	`brief_history` text,
	`deanery_id` integer,
	`parish_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `hierarchy_nodes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`deanery_id`) REFERENCES `deaneries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parish_id`) REFERENCES `parishes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hierarchy_nodes_slug_unique` ON `hierarchy_nodes` (`slug`);--> statement-breakpoint
CREATE TABLE `leadership_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`eyebrow` text,
	`intro` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leadership_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`name` text NOT NULL,
	`role_title` text NOT NULL,
	`photo_url` text,
	`bio` text,
	`email` text,
	`phone` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `leadership_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
