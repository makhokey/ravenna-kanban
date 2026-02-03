import type { Db } from "@repo/db";
import { cards, columns, sequences } from "@repo/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, isNull } from "drizzle-orm";
import { generateKeyBetween } from "fractional-indexing";
import { v4 as uuidv4 } from "uuid";
import {
  createCardServerSchema,
  updateCardServerSchema,
} from "~/components/shared/card-schema";
import { getDb } from "~/lib/db";
import { invalidateBoardCache } from "./cache";

// Helper to invalidate cache for a given column
async function invalidateCacheForColumn(db: Db, columnId: string): Promise<void> {
  const [column] = await db.select().from(columns).where(eq(columns.id, columnId));
  if (column) {
    await invalidateBoardCache(column.boardId);
  }
}

// Helper to invalidate cache for a card (looks up column from card)
async function invalidateCacheForCard(db: Db, cardId: string): Promise<void> {
  const [card] = await db.select().from(cards).where(eq(cards.id, cardId));
  if (card) {
    await invalidateCacheForColumn(db, card.columnId);
  }
}

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
    const id = uuidv4();
    const now = new Date();

    // Get and increment sequence for displayId
    const [sequence] = await db
      .select()
      .from(sequences)
      .where(eq(sequences.name, "card"));
    const nextNumber = sequence?.nextId ?? 1;
    const displayId = `RAV-${nextNumber}`;

    await db
      .update(sequences)
      .set({ nextId: nextNumber + 1 })
      .where(eq(sequences.name, "card"));

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
      displayId,
      title: data.title,
      description: data.description ?? null,
      columnId: data.columnId,
      priority: data.priority ?? null,
      status: data.status ?? null,
      tags: data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null,
      position,
      createdAt: now,
      updatedAt: now,
    });

    await invalidateCacheForColumn(db, data.columnId);

    return { id, displayId };
  });

// Move card (change column and/or position)
export const moveCard = createServerFn({ method: "POST" })
  .inputValidator((data: { cardId: string; columnId: string; position: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    const { cardId, columnId, position } = data;

    try {
      await db
        .update(cards)
        .set({ columnId, position, updatedAt: new Date() })
        .where(eq(cards.id, cardId));

      await invalidateCacheForColumn(db, columnId);

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
    const { id, tags, priority, status, ...updates } = data;

    // Build the update object, handling null for clearing vs undefined for unchanged
    const updateValues: Record<string, unknown> = {
      ...updates,
      updatedAt: new Date(),
    };

    // Handle priority: null = clear, undefined = unchanged
    if (priority !== undefined) {
      updateValues.priority = priority;
    }

    // Handle status: null = clear, undefined = unchanged
    if (status !== undefined) {
      updateValues.status = status;
    }

    // Handle tags: null = clear, undefined = unchanged
    if (tags !== undefined) {
      updateValues.tags = tags && tags.length > 0 ? JSON.stringify(tags) : null;
    }

    await db.update(cards).set(updateValues).where(eq(cards.id, id));

    await invalidateCacheForCard(db, id);

    return { success: true };
  });

// Delete card (soft delete)
export const deleteCard = createServerFn({ method: "POST" })
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();

    // Need to get card's columnId before soft delete for cache invalidation
    const [card] = await db.select().from(cards).where(eq(cards.id, data.id));

    // Soft delete: set deletedAt timestamp instead of removing
    await db.update(cards).set({ deletedAt: new Date() }).where(eq(cards.id, data.id));

    if (card) {
      await invalidateCacheForColumn(db, card.columnId);
    }

    return { success: true };
  });
