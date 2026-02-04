import type { Card, GroupBy, Priority, StatusValue } from "@repo/db/types";

export type CardData = Card;

// Re-export from @repo/db for convenience
export type { GroupBy, StatusValue };
// Alias for backward compatibility
export type PriorityValue = Priority | null;

// Domain-specific normalized structure for O(1) lookups
export interface NormalizedBoard {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  cardsById: Record<string, CardData>;
  // Status grouping
  statusOrder: StatusValue[];
  cardIdsByStatus: Record<StatusValue, string[]>;
  // Priority grouping
  priorityOrder: (Priority | "none")[];
  cardIdsByPriority: Record<string, string[]>;
}
