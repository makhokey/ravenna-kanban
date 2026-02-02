CREATE TABLE `sequences` (
	`name` text PRIMARY KEY NOT NULL,
	`next_id` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `cards` ADD `display_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `cards_display_id_unique` ON `cards` (`display_id`);