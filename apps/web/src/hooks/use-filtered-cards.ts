import { useMemo } from "react";
import { safeParseJsonTags } from "~/components/shared/card-schema";

interface FilterableCard {
  priority: string | null;
  tags: string | null;
}

/**
 * Filters cards based on priority and tag filters.
 * Returns the filtered array of cards.
 */
export function useFilteredCards<T extends FilterableCard>(
  cards: T[],
  priorityFilters: Set<string>,
  tagFilters: Set<string>,
): T[] {
  return useMemo(() => {
    if (priorityFilters.size === 0 && tagFilters.size === 0) {
      return cards;
    }

    return cards.filter((card) => {
      // Priority filter
      if (priorityFilters.size > 0) {
        const cardPriority = card.priority ?? "no priority";
        if (!priorityFilters.has(cardPriority)) return false;
      }

      // Tag filter (card must have at least one selected tag)
      if (tagFilters.size > 0) {
        const cardTags = safeParseJsonTags(card.tags);
        if (!cardTags.some((tag) => tagFilters.has(tag))) return false;
      }

      return true;
    });
  }, [cards, priorityFilters, tagFilters]);
}

/**
 * Filters card IDs based on priority and tag filters.
 * Returns the filtered array of card IDs.
 */
export function useFilteredCardIds<T extends FilterableCard>(
  cardIds: string[],
  cardsById: Record<string, T>,
  priorityFilters: Set<string>,
  tagFilters: Set<string>,
): string[] {
  return useMemo(() => {
    if (priorityFilters.size === 0 && tagFilters.size === 0) {
      return cardIds;
    }

    return cardIds.filter((id) => {
      const card = cardsById[id];
      if (!card) return false;

      // Priority filter
      if (priorityFilters.size > 0) {
        const cardPriority = card.priority ?? "no priority";
        if (!priorityFilters.has(cardPriority)) return false;
      }

      // Tag filter (card must have at least one selected tag)
      if (tagFilters.size > 0) {
        const cardTags = safeParseJsonTags(card.tags);
        if (!cardTags.some((tag) => tagFilters.has(tag))) return false;
      }

      return true;
    });
  }, [cardIds, cardsById, priorityFilters, tagFilters]);
}
