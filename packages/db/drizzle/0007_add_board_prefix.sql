-- Migration: Add display ID prefix columns to boards table
-- Each board now has its own prefix (e.g., "MYP", "BUG") and card number sequence

-- Step 1: Add display_id_prefix column (default 'RAV' for existing boards)
ALTER TABLE `boards` ADD COLUMN `display_id_prefix` TEXT NOT NULL DEFAULT 'RAV';
--> statement-breakpoint

-- Step 2: Add next_card_number column (default 1 for new boards)
ALTER TABLE `boards` ADD COLUMN `next_card_number` INTEGER NOT NULL DEFAULT 1;
--> statement-breakpoint

-- Step 3: Update existing boards' next_card_number based on their current card count
-- This ensures new cards continue from where they left off
UPDATE `boards` SET `next_card_number` = (
  SELECT COALESCE(MAX(CAST(SUBSTR(`display_id`, 5) AS INTEGER)), 0) + 1
  FROM `cards`
  WHERE `cards`.`board_id` = `boards`.`id`
  AND `display_id` LIKE 'RAV-%'
);
--> statement-breakpoint

-- Step 4: Drop the unique index on display_id if it exists (uniqueness is now per-board via prefix)
DROP INDEX IF EXISTS `cards_display_id_unique`;
