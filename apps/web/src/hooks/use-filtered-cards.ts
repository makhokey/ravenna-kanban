import { useMemo } from "react";
import type { SortDirection, SortField } from "~/atoms/board-atoms";
import { safeParseJsonTags } from "~/lib/card-config";

interface FilterableCard {
  priority: string;
  tags: string | null;
}

interface SortableCard extends FilterableCard {
  createdAt: Date;
  updatedAt: Date;
}

function matchesFilters(
  card: FilterableCard,
  priorityFilters: Set<string>,
  tagFilters: Set<string>,
): boolean {
  if (priorityFilters.size > 0 && !priorityFilters.has(card.priority)) {
    return false;
  }
  if (tagFilters.size > 0) {
    const cardTags = safeParseJsonTags(card.tags);
    if (!cardTags.some((tag) => tagFilters.has(tag))) return false;
  }
  return true;
}

export function useFilteredCards<T extends SortableCard>(
  cards: T[],
  priorityFilters: Set<string>,
  tagFilters: Set<string>,
  sortField: SortField,
  sortDirection: SortDirection,
): T[] {
  return useMemo(() => {
    let result = cards;

    // Apply filters
    if (priorityFilters.size > 0 || tagFilters.size > 0) {
      result = result.filter((card) => matchesFilters(card, priorityFilters, tagFilters));
    }

    // Apply sorting (skip for manual - preserve original order)
    if (sortField !== "manual") {
      result = [...result].sort((a, b) => {
        const timeA = sortField === "created" ? a.createdAt : a.updatedAt;
        const timeB = sortField === "created" ? b.createdAt : b.updatedAt;
        const cmp = new Date(timeA).getTime() - new Date(timeB).getTime();
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [cards, priorityFilters, tagFilters, sortField, sortDirection]);
}

export function useFilteredCardIds<T extends SortableCard>(
  cardIds: string[],
  cardsById: Record<string, T>,
  priorityFilters: Set<string>,
  tagFilters: Set<string>,
  sortField: SortField,
  sortDirection: SortDirection,
): string[] {
  return useMemo(() => {
    let result = cardIds;

    // Apply filters
    if (priorityFilters.size > 0 || tagFilters.size > 0) {
      result = result.filter((id) => {
        const card = cardsById[id];
        return card && matchesFilters(card, priorityFilters, tagFilters);
      });
    }

    // Apply sorting by created or updated time (skip for manual - preserve original order)
    if (sortField !== "manual") {
      result = [...result].sort((a, b) => {
        const cardA = cardsById[a];
        const cardB = cardsById[b];
        if (!cardA || !cardB) return 0;

        const timeA = sortField === "created" ? cardA.createdAt : cardA.updatedAt;
        const timeB = sortField === "created" ? cardB.createdAt : cardB.updatedAt;
        const cmp = new Date(timeA).getTime() - new Date(timeB).getTime();
        return sortDirection === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [cardIds, cardsById, priorityFilters, tagFilters, sortField, sortDirection]);
}
