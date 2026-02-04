import type { Card } from "@repo/db/types";

export type CardData = Card;

export type StatusValue = "backlog" | "todo" | "in_progress" | "review" | "done";
export type PriorityValue = "low" | "medium" | "high" | "urgent" | null;
export type GroupBy = "status" | "priority";

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
  priorityOrder: (PriorityValue | "none")[];
  cardIdsByPriority: Record<string, string[]>;
}
