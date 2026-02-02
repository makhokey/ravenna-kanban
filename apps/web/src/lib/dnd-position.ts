import { generateKeyBetween } from "fractional-indexing";
import type { CardData, NormalizedBoard } from "~/types/board";

type DropPositionResult = {
  newPosition: string;
  insertIndex: number;
};

/**
 * Calculate the new position for a dropped card using fractional indexing.
 * Returns the new position string and the insert index.
 */
export function calculateDropPosition(
  board: NormalizedBoard,
  activeId: string,
  targetColumnId: string,
  overId: string,
  overCard: CardData | undefined,
): DropPositionResult {
  const targetCardIds = board.cardIdsByColumn[targetColumnId] ?? [];

  if (overCard) {
    // Dropped on a card - insert relative to it
    const overIndex = targetCardIds.indexOf(overId);
    const activeIndex = targetCardIds.indexOf(activeId);

    // Determine if inserting before or after the over card
    const insertAfter = activeIndex !== -1 && activeIndex < overIndex;

    if (insertAfter) {
      // Insert after over card
      const afterId = targetCardIds[overIndex + 1];
      const afterCard = afterId ? board.cardsById[afterId] : null;
      const newPosition = generateKeyBetween(
        overCard.position,
        afterCard?.position ?? null,
      );
      return { newPosition, insertIndex: overIndex + 1 };
    } else {
      // Insert before over card
      const beforeId = targetCardIds[overIndex - 1];
      const beforeCard = beforeId ? board.cardsById[beforeId] : null;
      const newPosition = generateKeyBetween(
        beforeCard?.position ?? null,
        overCard.position,
      );
      return { newPosition, insertIndex: overIndex };
    }
  } else {
    // Dropped on empty column - add at end
    const lastId = targetCardIds[targetCardIds.length - 1];
    const lastCard = lastId ? board.cardsById[lastId] : null;
    const newPosition = generateKeyBetween(lastCard?.position ?? null, null);
    return { newPosition, insertIndex: targetCardIds.length };
  }
}

/**
 * Compute the optimistic card order after a drag operation.
 * This prevents UI flicker during the drop animation.
 */
export function computeOptimisticCardOrder(
  board: NormalizedBoard,
  activeId: string,
  sourceColumnId: string,
  targetColumnId: string,
  insertIndex: number,
): Record<string, string[]> {
  const sourceCardIds = board.cardIdsByColumn[sourceColumnId] ?? [];
  const targetCardIds = board.cardIdsByColumn[targetColumnId] ?? [];

  const newOrder: Record<string, string[]> = { ...board.cardIdsByColumn };

  if (sourceColumnId === targetColumnId) {
    // Same column reorder
    const currentIds = [...sourceCardIds];
    const currentIndex = currentIds.indexOf(activeId);
    currentIds.splice(currentIndex, 1);
    // Adjust insert index if we removed from before
    const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
    currentIds.splice(adjustedIndex, 0, activeId);
    newOrder[sourceColumnId] = currentIds;
  } else {
    // Cross-column move
    newOrder[sourceColumnId] = sourceCardIds.filter((id) => id !== activeId);
    const newTargetIds = [...targetCardIds];
    newTargetIds.splice(insertIndex, 0, activeId);
    newOrder[targetColumnId] = newTargetIds;
  }

  return newOrder;
}
