import { PRIORITY_VALUES, STATUS_VALUES } from "@repo/db/constants";
import { boards, cards } from "@repo/db/schema";
import type { Board, Card } from "@repo/db/types";
import { createServerFn } from "@tanstack/react-start";
import { eq, isNull } from "drizzle-orm";
import { getBoardSettingsFromRequest, type BoardSettings } from "~/lib/cookies.server";
import { getDb } from "~/lib/db";
import { boardLogger } from "~/lib/logger";

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
    slug: board.slug,
    displayIdPrefix: board.displayIdPrefix,
    nextCardNumber: board.nextCardNumber,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    cardsById,
    statusOrder: STATUS_ORDER,
    cardIdsByStatus,
    priorityOrder: [...PRIORITY_ORDER],
    cardIdsByPriority,
  };
}

// Get board with cards by slug
export const getBoard = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const log = boardLogger.child({ fn: "getBoard", boardSlug: data.slug });
    log.info("fetching board");
    const db = getDb();

    const board = await db.query.boards.findFirst({
      where: eq(boards.slug, data.slug),
      with: {
        cards: {
          where: isNull(cards.deletedAt),
          orderBy: (c, { asc }) => [asc(c.position)],
        },
      },
    });

    const result = board ? normalizeBoard(board) : null;
    log.info(
      { cardCount: result?.cardsById ? Object.keys(result.cardsById).length : 0 },
      "board fetched",
    );
    return result;
  });

// Get first board slug (for redirects)
export const getFirstBoardSlug = createServerFn({ method: "GET" }).handler(async () => {
  const log = boardLogger.child({ fn: "getFirstBoardSlug" });
  log.info("fetching first board slug");
  const db = getDb();

  const board = await db.query.boards.findFirst({
    columns: { slug: true },
    orderBy: (b, { asc }) => [asc(b.createdAt)],
  });

  log.info({ boardSlug: board?.slug ?? null }, "first board slug fetched");
  return board?.slug ?? null;
});

// Get board settings from cookies
export const getBoardSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<BoardSettings> => {
    const log = boardLogger.child({ fn: "getBoardSettings" });
    log.debug("reading board settings from cookies");
    const settings = getBoardSettingsFromRequest();
    log.debug(
      { viewMode: settings.viewMode, groupBy: settings.groupBy },
      "board settings loaded",
    );
    return settings;
  },
);
