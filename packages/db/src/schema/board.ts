import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Priority, StatusValue } from "../constants";

export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  displayId: text("display_id").unique(), // "RAV-1", "RAV-2" - human-readable ID
  title: text("title").notNull(),
  description: text("description"),
  position: text("position").notNull(),
  priority: text("priority").$type<Priority>().notNull().default("none"),
  status: text("status").$type<StatusValue>().notNull().default("backlog"),
  tags: text("tags"), // JSON array as string
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }), // null = not deleted (soft delete)
});

// Sequences table for generating sequential IDs
export const sequences = sqliteTable("sequences", {
  name: text("name").primaryKey(), // "card" - allows future sequences
  nextId: integer("next_id").notNull().default(1),
});

// Relations
export const boardsRelations = relations(boards, ({ many }) => ({
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one }) => ({
  board: one(boards, { fields: [cards.boardId], references: [boards.id] }),
}));
