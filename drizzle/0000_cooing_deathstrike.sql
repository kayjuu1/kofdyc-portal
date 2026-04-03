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
CREATE TABLE `election_candidates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`election_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`portfolio` text NOT NULL,
	`bio` text,
	`photo_url` text,
	`votes` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `election_votes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`election_id` integer NOT NULL,
	`candidate_id` integer NOT NULL,
	`voter_id` text NOT NULL,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`election_id`) REFERENCES `elections`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`candidate_id`) REFERENCES `election_candidates`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`voter_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `elections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`nomination_start` text NOT NULL,
	`nomination_end` text NOT NULL,
	`voting_start` text NOT NULL,
	`voting_end` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
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
	`registration_type` text DEFAULT 'free' NOT NULL,
	`fee_amount` real,
	`fee_currency` text DEFAULT 'GHS' NOT NULL,
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
CREATE TABLE `news` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`slug` text,
	`body` text NOT NULL,
	`scope` text DEFAULT 'diocese' NOT NULL,
	`scope_id` integer,
	`cover_image_url` text,
	`images` text,
	`is_featured` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`published_at` text,
	`author_id` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_slug_unique` ON `news` (`slug`);--> statement-breakpoint
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
	`parish_id` integer NOT NULL,
	`year` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`submitting_officer` text,
	`submission_date` text,
	`final_approval_date` text,
	`pdf_url` text,
	`created_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	`updated_at` text DEFAULT 'CURRENT_TIMESTAMP' NOT NULL,
	FOREIGN KEY (`parish_id`) REFERENCES `parishes`(`id`) ON UPDATE no action ON DELETE no action
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
	`payment_status` text DEFAULT 'free' NOT NULL,
	`registration_status` text DEFAULT 'pending' NOT NULL,
	`paid_at` text,
	`paystack_reference` text,
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
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`phone` text,
	`parish_id` integer,
	`deanery_id` integer,
	`is_active` integer DEFAULT true NOT NULL
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
