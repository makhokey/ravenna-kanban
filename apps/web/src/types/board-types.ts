import type { Card, GroupBy, Priority, StatusValue } from "@repo/db/types";

export type CardData = Card;

// Re-export from @repo/db for convenience
export type { GroupBy, Priority, StatusValue };

// Domain-specific normalized structure for O(1) lookups
export interface NormalizedBoard {
  id: string;
  name: string;
  slug: string;
  displayIdPrefix: string;
  nextCardNumber: number;
  createdAt: Date;
  updatedAt: Date;
  cardsById: Record<string, CardData>;
  // Status grouping
  statusOrder: StatusValue[];
  cardIdsByStatus: Record<StatusValue, string[]>;
  // Priority grouping
  priorityOrder: Priority[];
  cardIdsByPriority: Record<string, string[]>;
}
