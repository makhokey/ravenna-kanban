import { useMemo } from "react";
import { safeParseJsonTags } from "~/components/shared/card-schema";

interface FilterableCard {
  priority: string | null;
  tags: string | null;
}

function matchesFilters(
  card: FilterableCard,
  priorityFilters: Set<string>,
  tagFilters: Set<string>,
): boolean {
  if (priorityFilters.size > 0) {
    const cardPriority = card.priority ?? "no priority";
    if (!priorityFilters.has(cardPriority)) return false;
  }
  if (tagFilters.size > 0) {
    const cardTags = safeParseJsonTags(card.tags);
    if (!cardTags.some((tag) => tagFilters.has(tag))) return false;
  }
  return true;
}

export function useFilteredCards<T extends FilterableCard>(
  cards: T[],
  priorityFilters: Set<string>,
  tagFilters: Set<string>,
): T[] {
  return useMemo(() => {
    if (priorityFilters.size === 0 && tagFilters.size === 0) {
      return cards;
    }
    return cards.filter((card) => matchesFilters(card, priorityFilters, tagFilters));
  }, [cards, priorityFilters, tagFilters]);
}

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
      return card && matchesFilters(card, priorityFilters, tagFilters);
    });
  }, [cardIds, cardsById, priorityFilters, tagFilters]);
}
