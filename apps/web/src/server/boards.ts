import { boards, columns } from "@repo/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { getDb } from "~/lib/db";

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

    return board;
  });

// Get first board (for default board navigation)
export const getFirstBoard = createServerFn().handler(async () => {
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

  return board;
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

    const maxPosition = existingColumns.reduce((max, col) => Math.max(max, col.position), -1);

    await db.insert(columns).values({
      id,
      name: data.name,
      position: maxPosition + 1,
      boardId: data.boardId,
      createdAt: now,
      updatedAt: now,
    });

    return { id };
  });

// Update column
export const updateColumn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string; name?: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    const { id, ...updates } = data;

    await db
      .update(columns)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(columns.id, id));

    return { success: true };
  });

// Delete column
export const deleteColumn = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    await db.delete(columns).where(eq(columns.id, data.id));
    return { success: true };
  });
