/**
 * Hierarchical query key factory for granular cache control
 *
 * Structure enables:
 * - Targeted invalidation (e.g., just cards, not entire board)
 * - Optimistic updates with specific cache keys
 * - Proper cache hierarchy for TanStack Query
 */
export const boardKeys = {
  all: ["boards"] as const,
  lists: () => [...boardKeys.all, "list"] as const,
  detail: (id: string) => [...boardKeys.all, id] as const,
  cards: (boardId: string) => [...boardKeys.all, boardId, "cards"] as const,
  card: (boardId: string, cardId: string) =>
    [...boardKeys.cards(boardId), cardId] as const,
};

// Type helpers for query key inference
export type BoardKeys = typeof boardKeys;
export type BoardDetailKey = ReturnType<typeof boardKeys.detail>;
export type BoardCardsKey = ReturnType<typeof boardKeys.cards>;
