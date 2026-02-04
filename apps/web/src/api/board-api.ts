import { PRIORITY_VALUES, STATUS_VALUES } from "@repo/db/constants";
import { boards, cards } from "@repo/db/schema";
import type { Board, Card } from "@repo/db/types";
import { createServerFn } from "@tanstack/react-start";
import { eq, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "~/lib/db";
import { cacheKeys, getCached } from "./cache-utils";

import type { CardData, NormalizedBoard, StatusValue } from "~/types/board-types";

// Static orders derived from single source of truth
const STATUS_ORDER: StatusValue[] = [...STATUS_VALUES];
// Priority order: urgent first, none at end (PRIORITY_VALUES is already ["none", "low", ...])
const PRIORITY_ORDER = [...PRIORITY_VALUES].slice(1).reverse().concat("none");

// Type for Drizzle query result with relations
type BoardWithRelations = Board & {
  cards: Card[];
};

// Normalize board data for O(1) lookups
function normalizeBoard(board: BoardWithRelations): NormalizedBoard {
  const cardsById: Record<string, CardData> = {};
  const cardIdsByStatus: Record<StatusValue, string[]> = {
    backlog: [],
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  };
  const cardIdsByPriority: Record<string, string[]> = {
    urgent: [],
    high: [],
    medium: [],
    low: [],
    none: [],
  };

  for (const card of board.cards) {
    cardsById[card.id] = card;

    // Group by status
    const status = (card.status as StatusValue) || "backlog";
    cardIdsByStatus[status].push(card.id);

    // Group by priority (priority is never null, defaults to "none")
    const priority = card.priority;
    if (!cardIdsByPriority[priority]) {
      cardIdsByPriority[priority] = [];
    }
    cardIdsByPriority[priority].push(card.id);
  }

  return {
    id: board.id,
    name: board.name,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    cardsById,
    statusOrder: STATUS_ORDER,
    cardIdsByStatus,
    priorityOrder: [...PRIORITY_ORDER],
    cardIdsByPriority,
  };
}

// Get board with cards
export const getBoard = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();

    const board = await db.query.boards.findFirst({
      where: eq(boards.id, data.id),
      with: {
        cards: {
          where: isNull(cards.deletedAt),
          orderBy: (c, { asc }) => [asc(c.position)],
        },
      },
    });

    return board ? normalizeBoard(board) : null;
  });

// Get first board (for default board navigation)
export const getFirstBoard = createServerFn().handler(async () => {
  return getCached(cacheKeys.boardList(), async () => {
    const db = getDb();

    const board = await db.query.boards.findFirst({
      with: {
        cards: {
          where: isNull(cards.deletedAt),
          orderBy: (c, { asc }) => [asc(c.position)],
        },
      },
    });

    return board ? normalizeBoard(board) : null;
  });
});

// Create default board (for initial setup)
export const createDefaultBoard = createServerFn().handler(async () => {
  const db = getDb();
  const boardId = uuidv4();
  const now = new Date();

  await db.insert(boards).values({
    id: boardId,
    name: "My Board",
    createdAt: now,
    updatedAt: now,
  });

  return { id: boardId };
});
