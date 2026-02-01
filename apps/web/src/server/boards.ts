import type { Board, Card, Column } from "@repo/db/types";
import { boards, columns } from "@repo/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db";
import { cacheKeys, getCached, invalidateBoardCache } from "./cache";

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
  const boardId = crypto.randomUUID();
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
      id: crypto.randomUUID(),
      name: defaultColumns[i]!,
      position: i,
      boardId,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { id: boardId };
});

// Create column
export const createColumn = createServerFn({ method: "POST" })
  .inputValidator((data: { boardId: string; name: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    // Get max position in board
    const existingColumns = await db
      .select()
      .from(columns)
      .where(eq(columns.boardId, data.boardId));

    const maxPosition = existingColumns.reduce(
      (max, col) => Math.max(max, col.position),
      -1,
    );

    await db.insert(columns).values({
      id,
      name: data.name,
      position: maxPosition + 1,
      boardId: data.boardId,
      createdAt: now,
      updatedAt: now,
    });

    // Invalidate cache
    await invalidateBoardCache(data.boardId);

    return { id };
  });

// Update column
export const updateColumn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; name?: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    const { id, ...updates } = data;

    // Get column to find boardId for cache invalidation
    const [column] = await db.select().from(columns).where(eq(columns.id, id));

    await db
      .update(columns)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(columns.id, id));

    // Invalidate cache
    if (column) {
      await invalidateBoardCache(column.boardId);
    }

    return { success: true };
  });

// Delete column
export const deleteColumn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();

    // Get column to find boardId for cache invalidation
    const [column] = await db.select().from(columns).where(eq(columns.id, data.id));

    await db.delete(columns).where(eq(columns.id, data.id));

    // Invalidate cache
    if (column) {
      await invalidateBoardCache(column.boardId);
    }

    return { success: true };
  });
