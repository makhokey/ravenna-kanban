import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const boards = sqliteTable("boards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const columns = sqliteTable("columns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  boardId: text("board_id")
    .notNull()
    .references(() => boards.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const cards = sqliteTable("cards", {
  id: text("id").primaryKey(),
  displayId: text("display_id").unique(), // "RAV-1", "RAV-2" - human-readable ID
  title: text("title").notNull(),
  description: text("description"),
  position: text("position").notNull(),
  priority: text("priority"), // low, medium, high
  status: text("status"), // backlog, todo, in_progress, review, done
  tags: text("tags"), // JSON array as string
  columnId: text("column_id")
    .notNull()
    .references(() => columns.id, { onDelete: "cascade" }),
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
  columns: many(columns),
}));

export const columnsRelations = relations(columns, ({ one, many }) => ({
  board: one(boards, { fields: [columns.boardId], references: [boards.id] }),
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one }) => ({
  column: one(columns, { fields: [cards.columnId], references: [columns.id] }),
}));
