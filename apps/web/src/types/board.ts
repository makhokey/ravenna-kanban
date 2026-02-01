import type { Card, Column } from "@repo/db/types";

export type CardData = Card;
export type ColumnData = Column;

// Domain-specific normalized structure for O(1) lookups
export interface NormalizedBoard {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  columnIds: string[];
  columnsById: Record<string, ColumnData>;
  cardsById: Record<string, CardData>;
  cardIdsByColumn: Record<string, string[]>;
}
