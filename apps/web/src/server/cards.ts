import { cards } from "@repo/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "~/lib/db";

// List cards with optional filters
export const getCards = createServerFn({ method: "GET" })
  .inputValidator((data: { columnId?: string; priority?: "low" | "medium" | "high" } | undefined) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    const conditions = [];

    if (data?.columnId) conditions.push(eq(cards.columnId, data.columnId));
    if (data?.priority) conditions.push(eq(cards.priority, data.priority));

    return db
      .select()
      .from(cards)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(cards.position);
  });

// Create card
export const createCard = createServerFn({ method: "POST" })
  .inputValidator((data: {
    title: string;
    description?: string;
    columnId: string;
    priority?: "low" | "medium" | "high";
    tags?: string[];
  }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    // Get max position in column
    const [maxPos] = await db
      .select({ max: sql<number>`MAX(position)` })
      .from(cards)
      .where(eq(cards.columnId, data.columnId));

    await db.insert(cards).values({
      id,
      title: data.title,
      description: data.description ?? null,
      columnId: data.columnId,
      priority: data.priority ?? null,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      position: (maxPos?.max ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    });

    return { id };
  });

// Move card (change column and/or position)
export const moveCard = createServerFn({ method: "POST" })
  .inputValidator((data: { cardId: string; columnId: string; position: number }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    const { cardId, columnId, position } = data;

    // Get current card
    const [current] = await db.select().from(cards).where(eq(cards.id, cardId));
    if (!current) throw new Error("Card not found");

    // Reorder within same column or across columns
    await db.transaction(async (tx) => {
      if (current.columnId === columnId) {
        // Same column: shift cards between old and new position
        if (position > current.position) {
          await tx
            .update(cards)
            .set({ position: sql`position - 1` })
            .where(
              and(
                eq(cards.columnId, columnId),
                sql`position > ${current.position}`,
                sql`position <= ${position}`,
              ),
            );
        } else {
          await tx
            .update(cards)
            .set({ position: sql`position + 1` })
            .where(
              and(
                eq(cards.columnId, columnId),
                sql`position >= ${position}`,
                sql`position < ${current.position}`,
              ),
            );
        }
      } else {
        // Different column: close gap in source, make space in target
        await tx
          .update(cards)
          .set({ position: sql`position - 1` })
          .where(
            and(eq(cards.columnId, current.columnId), sql`position > ${current.position}`),
          );

        await tx
          .update(cards)
          .set({ position: sql`position + 1` })
          .where(and(eq(cards.columnId, columnId), sql`position >= ${position}`));
      }

      // Update the moved card
      await tx
        .update(cards)
        .set({ columnId, position, updatedAt: new Date() })
        .where(eq(cards.id, cardId));
    });

    return { success: true };
  });

// Update card
export const updateCard = createServerFn({ method: "POST" })
  .inputValidator((data: {
    id: string;
    title?: string;
    description?: string;
    priority?: "low" | "medium" | "high" | null;
    tags?: string[];
  }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    const { id, tags, ...updates } = data;

    await db
      .update(cards)
      .set({
        ...updates,
        tags: tags ? JSON.stringify(tags) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, id));

    return { success: true };
  });

// Delete card
export const deleteCard = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    await db.delete(cards).where(eq(cards.id, data.id));
    return { success: true };
  });
