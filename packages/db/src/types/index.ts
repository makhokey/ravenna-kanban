import type { boards, cards } from "../schema";
export * from "../constants";

// Inferred from Drizzle schema - auto-updates when schema changes
export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
