import { boards, cards, columns } from "@repo/db/schema";
import type { Board, Card, Column } from "@repo/db/types";
import { createServerFn } from "@tanstack/react-start";
import { eq, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "~/lib/db";
import { cacheKeys, getCached } from "./cache";

import type { CardData, ColumnData, NormalizedBoard } from "~/types/board";

// Type for Drizzle query result with relations
type BoardWithRelations = Board & {
  columns: Array<Column & { cards: Card[] }>;
};

// Normalize board data for O(1) lookups
function normalizeBoard(board: BoardWithRelations): NormalizedBoard {
  const columnsById: Record<string, ColumnData> = {};
  const cardsById: Record<string, CardData> = {};
  const cardIdsByColumn: Record<string, string[]> = {};
  const columnIds: string[] = [];

  for (const col of board.columns) {
    columnIds.push(col.id);
    const { cards, ...columnData } = col;
    columnsById[col.id] = columnData;
    cardIdsByColumn[col.id] = cards.map((c) => c.id); // Already sorted by Drizzle

    for (const card of cards) {
      cardsById[card.id] = card;
    }
  }

  return {
    id: board.id,
    name: board.name,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    columnIds,
    columnsById,
    cardsById,
    cardIdsByColumn,
  };
}

// Get board with columns and cards
export const getBoard = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();

    const board = await db.query.boards.findFirst({
      where: eq(boards.id, data.id),
      with: {
        columns: {
          orderBy: (cols, { asc }) => [asc(cols.position)],
          with: {
            cards: {
              where: isNull(cards.deletedAt),
              orderBy: (c, { asc }) => [asc(c.position)],
            },
          },
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
        columns: {
          orderBy: (cols, { asc }) => [asc(cols.position)],
          with: {
            cards: {
              where: isNull(cards.deletedAt),
              orderBy: (c, { asc }) => [asc(c.position)],
            },
          },
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

  // Create default columns
  const defaultColumns = ["To Do", "In Progress", "Done"];
  for (let i = 0; i < defaultColumns.length; i++) {
    await db.insert(columns).values({
      id: uuidv4(),
      name: defaultColumns[i]!,
      position: i,
      boardId,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { id: boardId };
});

