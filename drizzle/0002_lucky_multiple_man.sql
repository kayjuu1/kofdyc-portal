PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_hierarchy_nodes` (
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
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `hierarchy_nodes`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`deanery_id`) REFERENCES `deaneries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parish_id`) REFERENCES `parishes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_hierarchy_nodes`("id", "parent_id", "type", "name", "slug", "crest_url", "brief_history", "deanery_id", "parish_id", "sort_order", "is_published", "created_at", "updated_at") SELECT "id", "parent_id", "type", "name", "slug", "crest_url", "brief_history", "deanery_id", "parish_id", "sort_order", "is_published", "created_at", "updated_at" FROM `hierarchy_nodes`;--> statement-breakpoint
DROP TABLE `hierarchy_nodes`;--> statement-breakpoint
ALTER TABLE `__new_hierarchy_nodes` RENAME TO `hierarchy_nodes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `hierarchy_nodes_slug_unique` ON `hierarchy_nodes` (`slug`);--> statement-breakpoint
CREATE INDEX `hierarchy_nodes_parent_id_idx` ON `hierarchy_nodes` (`parent_id`);--> statement-breakpoint
CREATE INDEX `hierarchy_nodes_deanery_id_idx` ON `hierarchy_nodes` (`deanery_id`);--> statement-breakpoint
CREATE INDEX `hierarchy_nodes_parish_id_idx` ON `hierarchy_nodes` (`parish_id`);--> statement-breakpoint
CREATE TABLE `__new_featured_events` (
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
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_featured_events`("id", "event_id", "display_title", "artwork_url", "target_date", "cta_label", "cta_url", "support_line", "is_active", "sort_order", "created_by", "created_at", "updated_at") SELECT "id", "event_id", "display_title", "artwork_url", "target_date", "cta_label", "cta_url", "support_line", "is_active", "sort_order", "created_by", "created_at", "updated_at" FROM `featured_events`;--> statement-breakpoint
DROP TABLE `featured_events`;--> statement-breakpoint
ALTER TABLE `__new_featured_events` RENAME TO `featured_events`;--> statement-breakpoint
CREATE INDEX `featured_events_event_id_idx` ON `featured_events` (`event_id`);--> statement-breakpoint
CREATE INDEX `featured_events_created_by_idx` ON `featured_events` (`created_by`);--> statement-breakpoint
CREATE INDEX `featured_events_is_active_idx` ON `featured_events` (`is_active`);--> statement-breakpoint
CREATE TABLE `__new_hierarchy_leaders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`node_id` integer NOT NULL,
	`name` text NOT NULL,
	`role_title` text NOT NULL,
	`photo_url` text,
	`phone` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`node_id`) REFERENCES `hierarchy_nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_hierarchy_leaders`("id", "node_id", "name", "role_title", "photo_url", "phone", "sort_order", "created_at") SELECT "id", "node_id", "name", "role_title", "photo_url", "phone", "sort_order", "created_at" FROM `hierarchy_leaders`;--> statement-breakpoint
DROP TABLE `hierarchy_leaders`;--> statement-breakpoint
ALTER TABLE `__new_hierarchy_leaders` RENAME TO `hierarchy_leaders`;--> statement-breakpoint
CREATE INDEX `hierarchy_leaders_node_id_idx` ON `hierarchy_leaders` (`node_id`);--> statement-breakpoint
CREATE TABLE `__new_leadership_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`eyebrow` text,
	`intro` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_leadership_groups`("id", "title", "eyebrow", "intro", "sort_order", "is_published", "created_at", "updated_at") SELECT "id", "title", "eyebrow", "intro", "sort_order", "is_published", "created_at", "updated_at" FROM `leadership_groups`;--> statement-breakpoint
DROP TABLE `leadership_groups`;--> statement-breakpoint
ALTER TABLE `__new_leadership_groups` RENAME TO `leadership_groups`;--> statement-breakpoint
CREATE TABLE `__new_leadership_members` (
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
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `leadership_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_leadership_members`("id", "group_id", "name", "role_title", "photo_url", "bio", "email", "phone", "sort_order", "is_published", "created_at", "updated_at") SELECT "id", "group_id", "name", "role_title", "photo_url", "bio", "email", "phone", "sort_order", "is_published", "created_at", "updated_at" FROM `leadership_members`;--> statement-breakpoint
DROP TABLE `leadership_members`;--> statement-breakpoint
ALTER TABLE `__new_leadership_members` RENAME TO `leadership_members`;--> statement-breakpoint
CREATE INDEX `leadership_members_group_id_idx` ON `leadership_members` (`group_id`);--> statement-breakpoint
-- Data migration: /executive was replaced by /leadership — carry the currently
-- published dyc_executive team over so the public page does not go blank.
-- No-op when dyc_executive is empty or leadership content already exists.
INSERT INTO `leadership_groups` (`title`, `eyebrow`, `intro`, `sort_order`, `is_published`, `created_at`, `updated_at`)
SELECT 'Diocesan Youth|Executive', 'Leadership', NULL, 0, 1,
       strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE EXISTS (SELECT 1 FROM `dyc_executive` WHERE `is_current` = 1)
  AND NOT EXISTS (SELECT 1 FROM `leadership_groups`);--> statement-breakpoint
INSERT INTO `leadership_members` (`group_id`, `name`, `role_title`, `photo_url`, `email`, `phone`, `sort_order`, `is_published`, `created_at`, `updated_at`)
SELECT g.`id`, e.`name`, e.`portfolio`, e.`photo_url`, e.`email`, e.`phone`, e.`id`, 1,
       strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM `dyc_executive` e
JOIN `leadership_groups` g ON g.`title` = 'Diocesan Youth|Executive'
WHERE e.`is_current` = 1
  AND NOT EXISTS (SELECT 1 FROM `leadership_members`);