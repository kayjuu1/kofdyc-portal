ALTER TABLE `submission_prompts` ADD `is_suspended` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `submission_prompts` ADD `expires_at` text;