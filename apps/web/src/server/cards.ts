import { cards, columns } from "@repo/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, isNull } from "drizzle-orm";
import { generateKeyBetween } from "fractional-indexing";
import {
  createCardServerSchema,
  updateCardServerSchema,
} from "~/components/kanban/card-schema";
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
    // Always filter out soft-deleted cards
    const conditions = [isNull(cards.deletedAt)];

    if (data?.columnId) conditions.push(eq(cards.columnId, data.columnId));
    if (data?.priority) conditions.push(eq(cards.priority, data.priority));

    return db
      .select()
      .from(cards)
      .where(and(...conditions))
      .orderBy(cards.position);
  });

// Create card
export const createCard = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const result = createCardServerSchema.safeParse(data);
    if (!result.success) {
      throw new Error(result.error.issues[0]?.message ?? "Invalid input");
    }
    return result.data;
  })
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
      tags: data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null,
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
  .inputValidator((data: unknown) => {
    const result = updateCardServerSchema.safeParse(data);
    if (!result.success) {
      throw new Error(result.error.issues[0]?.message ?? "Invalid input");
    }
    return result.data;
  })
  .handler(async ({ data }) => {
    const db = getDb();
    const { id, tags, priority, ...updates } = data;

    // Get card to find column and boardId for cache invalidation
    const [card] = await db.select().from(cards).where(eq(cards.id, id));

    // Build the update object, handling null for clearing vs undefined for unchanged
    const updateValues: Record<string, unknown> = {
      ...updates,
      updatedAt: new Date(),
    };

    // Handle priority: null = clear, undefined = unchanged
    if (priority !== undefined) {
      updateValues.priority = priority;
    }

    // Handle tags: null = clear, undefined = unchanged
    if (tags !== undefined) {
      updateValues.tags = tags && tags.length > 0 ? JSON.stringify(tags) : null;
    }

    await db.update(cards).set(updateValues).where(eq(cards.id, id));

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

// Delete card (soft delete)
export const deleteCard = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();

    // Get card to find column and boardId for cache invalidation
    const [card] = await db.select().from(cards).where(eq(cards.id, data.id));

    // Soft delete: set deletedAt timestamp instead of removing
    await db
      .update(cards)
      .set({ deletedAt: new Date() })
      .where(eq(cards.id, data.id));

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
