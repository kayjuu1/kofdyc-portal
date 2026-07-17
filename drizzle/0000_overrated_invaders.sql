CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`action` text NOT NULL,
	`resource_type` text,
	`resource_id` text,
	`metadata` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `deaneries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`diocese_id` integer,
	`dean_name` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`diocese_id`) REFERENCES `diocese`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `diocese` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`bishop_name` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`category` text DEFAULT 'other' NOT NULL,
	`scope` text DEFAULT 'diocese' NOT NULL,
	`scope_id` integer,
	`file_url` text NOT NULL,
	`file_name` text,
	`file_size` integer,
	`mime_type` text,
	`issuing_authority` text,
	`date_issued` text,
	`uploaded_by` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`uploaded_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `dyc_executive` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`portfolio` text NOT NULL,
	`photo_url` text,
	`email` text,
	`phone` text,
	`term_year` text NOT NULL,
	`is_current` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`event_type` text DEFAULT 'other' NOT NULL,
	`scope` text DEFAULT 'parish' NOT NULL,
	`scope_id` integer,
	`start_at` text NOT NULL,
	`end_at` text,
	`venue` text,
	`google_maps_link` text,
	`cover_image_url` text,
	`registration_deadline` text,
	`capacity` integer,
	`contact_name` text,
	`contact_phone` text,
	`is_diocesan_priority` integer DEFAULT false NOT NULL,
	`liturgical_season` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`author_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
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
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `featured_events_event_id_idx` ON `featured_events` (`event_id`);--> statement-breakpoint
CREATE INDEX `featured_events_created_by_idx` ON `featured_events` (`created_by`);--> statement-breakpoint
CREATE INDEX `featured_events_is_active_idx` ON `featured_events` (`is_active`);--> statement-breakpoint
CREATE TABLE `hierarchy_leaders` (
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
CREATE INDEX `hierarchy_leaders_node_id_idx` ON `hierarchy_leaders` (`node_id`);--> statement-breakpoint
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
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `hierarchy_nodes`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`deanery_id`) REFERENCES `deaneries`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parish_id`) REFERENCES `parishes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hierarchy_nodes_slug_unique` ON `hierarchy_nodes` (`slug`);--> statement-breakpoint
CREATE INDEX `hierarchy_nodes_parent_id_idx` ON `hierarchy_nodes` (`parent_id`);--> statement-breakpoint
CREATE INDEX `hierarchy_nodes_deanery_id_idx` ON `hierarchy_nodes` (`deanery_id`);--> statement-breakpoint
CREATE INDEX `hierarchy_nodes_parish_id_idx` ON `hierarchy_nodes` (`parish_id`);--> statement-breakpoint
CREATE TABLE `leadership_groups` (
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
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`group_id`) REFERENCES `leadership_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `leadership_members_group_id_idx` ON `leadership_members` (`group_id`);--> statement-breakpoint
CREATE TABLE `news` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text,
	`body` text NOT NULL,
	`scope` text DEFAULT 'diocese' NOT NULL,
	`scope_id` integer,
	`cover_image_url` text,
	`images` text,
	`is_pinned` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` text,
	`author_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_slug_unique` ON `news` (`slug`);--> statement-breakpoint
CREATE TABLE `news_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`news_id` integer NOT NULL,
	`commenter_name` text NOT NULL,
	`body` text NOT NULL,
	`deleted_at` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`news_id`) REFERENCES `news`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `news_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`news_id` integer NOT NULL,
	`identifier` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`news_id`) REFERENCES `news`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `news_submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`submitter_name` text NOT NULL,
	`submitter_email` text,
	`submitter_phone` text,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`image_url` text,
	`images` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`reviewed_by` text,
	`reviewed_at` text,
	`review_comment` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `parishes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`deanery_id` integer,
	`priest_name` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`deanery_id`) REFERENCES `deaneries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `programme_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`programme_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`date` text NOT NULL,
	`responsible_person` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `programme_responses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`programme_id` integer NOT NULL,
	`field_id` integer NOT NULL,
	`value` text,
	FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_id`) REFERENCES `submission_prompt_fields`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `programme_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`programme_id` integer NOT NULL,
	`reviewer_id` text NOT NULL,
	`stage` integer NOT NULL,
	`decision` text NOT NULL,
	`comment` text,
	`reviewed_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`programme_id`) REFERENCES `programmes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reviewer_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `programmes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`parish_id` integer,
	`year` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`submitting_officer` text,
	`submission_date` text,
	`final_approval_date` text,
	`pdf_url` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`parish_id`) REFERENCES `parishes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitting_officer`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_id` integer NOT NULL,
	`user_id` text,
	`guest_name` text,
	`guest_email` text,
	`guest_phone` text,
	`parish` text,
	`emergency_contact_name` text,
	`emergency_contact_phone` text,
	`dietary_requirements` text,
	`medical_conditions` text,
	`tshirt_size` text,
	`registration_status` text DEFAULT 'pending' NOT NULL,
	`attended` integer DEFAULT false NOT NULL,
	`cancellation_token` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `submission_prompt_fields` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`prompt_id` integer NOT NULL,
	`label` text NOT NULL,
	`placeholder` text,
	`is_required` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`field_type` text DEFAULT 'text' NOT NULL,
	FOREIGN KEY (`prompt_id`) REFERENCES `submission_prompts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `submission_prompts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`created_by` text,
	`is_active` integer DEFAULT false NOT NULL,
	`is_suspended` integer DEFAULT false NOT NULL,
	`expires_at` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`role` text DEFAULT 'coordinator' NOT NULL,
	`phone` text,
	`parish_id` integer,
	`deanery_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`banned` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer
);
