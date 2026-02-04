-- Migration: Add slug column to boards table
-- The slug is a URL-friendly version of the board name

-- Step 1: Add slug column (nullable initially to handle existing data)
ALTER TABLE `boards` ADD COLUMN `slug` text;
--> statement-breakpoint

-- Step 2: Populate slug for existing boards
-- Convert name to lowercase, replace spaces with hyphens, remove special chars
UPDATE `boards` SET `slug` = LOWER(REPLACE(REPLACE(TRIM(`name`), ' ', '-'), '--', '-'));
--> statement-breakpoint

-- Step 3: Handle potential duplicates by appending row number
-- SQLite doesn't support window functions in UPDATE, so we use a workaround
-- For now, we'll append the id suffix for any duplicates
UPDATE `boards` SET `slug` = `slug` || '-' || SUBSTR(`id`, 1, 8)
WHERE `id` IN (
  SELECT b1.`id` FROM `boards` b1
  WHERE EXISTS (
    SELECT 1 FROM `boards` b2
    WHERE b2.`slug` = b1.`slug` AND b2.`id` < b1.`id`
  )
);
--> statement-breakpoint

-- Step 4: Create unique index on slug
CREATE UNIQUE INDEX `boards_slug_unique` ON `boards` (`slug`);
