-- Migration: Remove columns table, add boardId to cards
-- This migration:
-- 1. Creates new cards table with boardId instead of columnId
-- 2. Migrates data, setting status based on column name
-- 3. Drops the old columns table

-- Step 1: Create new cards table with correct schema
CREATE TABLE `cards_new` (
	`id` text PRIMARY KEY NOT NULL,
	`display_id` text,
	`title` text NOT NULL,
	`description` text,
	`position` text NOT NULL,
	`priority` text,
	`status` text DEFAULT 'backlog' NOT NULL,
	`tags` text,
	`board_id` text NOT NULL REFERENCES `boards`(`id`) ON DELETE CASCADE,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint

-- Step 2: Migrate data from old cards table
-- Map column names to status values
INSERT INTO `cards_new` (
	`id`, `display_id`, `title`, `description`, `position`, `priority`, `status`, `tags`, `board_id`, `created_at`, `updated_at`, `deleted_at`
)
SELECT
	c.`id`,
	c.`display_id`,
	c.`title`,
	c.`description`,
	c.`position`,
	c.`priority`,
	CASE
		WHEN LOWER(col.`name`) = 'backlog' THEN 'backlog'
		WHEN LOWER(col.`name`) IN ('to do', 'todo') THEN 'todo'
		WHEN LOWER(col.`name`) = 'in progress' THEN 'in_progress'
		WHEN LOWER(col.`name`) = 'review' THEN 'review'
		WHEN LOWER(col.`name`) = 'done' THEN 'done'
		WHEN c.`status` IS NOT NULL THEN c.`status`
		ELSE 'backlog'
	END as `status`,
	c.`tags`,
	col.`board_id`,
	c.`created_at`,
	c.`updated_at`,
	c.`deleted_at`
FROM `cards` c
JOIN `columns` col ON c.`column_id` = col.`id`;
--> statement-breakpoint

-- Step 3: Drop old cards table
DROP TABLE `cards`;
--> statement-breakpoint

-- Step 4: Rename new table to cards
ALTER TABLE `cards_new` RENAME TO `cards`;
--> statement-breakpoint

-- Step 5: Recreate unique index on display_id
CREATE UNIQUE INDEX `cards_display_id_unique` ON `cards` (`display_id`);
--> statement-breakpoint

-- Step 6: Drop columns table
DROP TABLE `columns`;
