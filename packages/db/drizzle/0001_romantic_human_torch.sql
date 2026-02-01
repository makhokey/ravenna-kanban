PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_cards` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`position` text NOT NULL,
	`priority` text,
	`tags` text,
	`column_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`column_id`) REFERENCES `columns`(`id`) ON UPDATE no action ON DELETE cascade
);--> statement-breakpoint
-- Convert integer positions to fractional indices (a0, a1, a2, ...)
-- This maintains ordering while using the fractional-indexing format
INSERT INTO `__new_cards`("id", "title", "description", "position", "priority", "tags", "column_id", "created_at", "updated_at")
SELECT "id", "title", "description", 'a' || "position", "priority", "tags", "column_id", "created_at", "updated_at" FROM `cards`;--> statement-breakpoint
DROP TABLE `cards`;--> statement-breakpoint
ALTER TABLE `__new_cards` RENAME TO `cards`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
