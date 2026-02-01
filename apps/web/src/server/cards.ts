import { cards, columns } from "@repo/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { generateKeyBetween } from "fractional-indexing";
import { getDb } from "~/lib/db";
import { invalidateBoardCache } from "./cache";

// List cards with optional filters
export const getCards = createServerFn({ method: "GET" })
  .inputValidator(
    (data: { columnId?: string; priority?: "low" | "medium" | "high" } | undefined) =>
      data,
  )
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
  .inputValidator(
    (data: {
      title: string;
      description?: string;
      columnId: string;
      priority?: "low" | "medium" | "high";
      tags?: string[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = new Date();

    // Get column to find boardId for cache invalidation
    const [column] = await db.select().from(columns).where(eq(columns.id, data.columnId));

    // Get the last card's position in the column to append after it
    const existingCards = await db
      .select({ position: cards.position })
      .from(cards)
      .where(eq(cards.columnId, data.columnId))
      .orderBy(cards.position);

    const lastPosition =
      existingCards.length > 0 ? existingCards[existingCards.length - 1]!.position : null;

    // Generate a position after the last card (or first position if empty)
    const position = generateKeyBetween(lastPosition, null);

    await db.insert(cards).values({
      id,
      title: data.title,
      description: data.description ?? null,
      columnId: data.columnId,
      priority: data.priority ?? null,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      position,
      createdAt: now,
      updatedAt: now,
    });

    // Invalidate cache
    if (column) {
      await invalidateBoardCache(column.boardId);
    }

    return { id };
  });

// Move card (change column and/or position)
export const moveCard = createServerFn({ method: "POST" })
  .inputValidator((data: { cardId: string; columnId: string; position: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    const { cardId, columnId, position } = data;

    try {
      // Get column to find boardId for cache invalidation
      const [column] = await db.select().from(columns).where(eq(columns.id, columnId));

      await db
        .update(cards)
        .set({ columnId, position, updatedAt: new Date() })
        .where(eq(cards.id, cardId));

      // Invalidate cache
      if (column) {
        await invalidateBoardCache(column.boardId);
      }

      return { success: true };
    } catch (error) {
      console.error("moveCard error:", error);
      throw error;
    }
  });

// Update card
export const updateCard = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      id: string;
      title?: string;
      description?: string;
      priority?: "low" | "medium" | "high" | null;
      tags?: string[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const { id, tags, ...updates } = data;

    // Get card to find column and boardId for cache invalidation
    const [card] = await db.select().from(cards).where(eq(cards.id, id));

    await db
      .update(cards)
      .set({
        ...updates,
        tags: tags ? JSON.stringify(tags) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(cards.id, id));

    // Invalidate cache
    if (card) {
      const [column] = await db
        .select()
        .from(columns)
        .where(eq(columns.id, card.columnId));
      if (column) {
        await invalidateBoardCache(column.boardId);
      }
    }

    return { success: true };
  });

// Delete card
export const deleteCard = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();

    // Get card to find column and boardId for cache invalidation
    const [card] = await db.select().from(cards).where(eq(cards.id, data.id));

    await db.delete(cards).where(eq(cards.id, data.id));

    // Invalidate cache
    if (card) {
      const [column] = await db
        .select()
        .from(columns)
        .where(eq(columns.id, card.columnId));
      if (column) {
        await invalidateBoardCache(column.boardId);
      }
    }

    return { success: true };
  });
