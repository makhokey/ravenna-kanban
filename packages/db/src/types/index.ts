import type { boards, cards, columns } from "../schema";

// Inferred from Drizzle schema - auto-updates when schema changes
export type Board = typeof boards.$inferSelect;
export type NewBoard = typeof boards.$inferInsert;

export type Column = typeof columns.$inferSelect;
export type NewColumn = typeof columns.$inferInsert;

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
