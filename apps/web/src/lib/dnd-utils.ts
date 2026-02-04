import {
  defaultAnimateLayoutChanges,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { generateKeyBetween } from "fractional-indexing";
import type { CardData, NormalizedBoard, StatusValue } from "~/types/board-types";

/**
 * Custom animate layout changes config for cards.
 * Always animates when the item was previously dragging.
 */
export const cardAnimateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

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
  targetStatus: StatusValue,
  overId: string,
  overCard: CardData | undefined,
): DropPositionResult {
  const targetCardIds = board.cardIdsByStatus[targetStatus] ?? [];
  return calculateDropPositionInGroup(board, activeId, targetCardIds, overId, overCard);
}

/**
 * Calculate drop position for priority-based grouping.
 */
export function calculateDropPositionByPriority(
  board: NormalizedBoard,
  activeId: string,
  priorityGroup: string,
  overId: string,
  overCard: CardData | undefined,
): DropPositionResult {
  const targetCardIds = board.cardIdsByPriority[priorityGroup] ?? [];
  return calculateDropPositionInGroup(board, activeId, targetCardIds, overId, overCard);
}

/**
 * Generic position calculation for any card group.
 */
function calculateDropPositionInGroup(
  board: NormalizedBoard,
  activeId: string,
  targetCardIds: string[],
  overId: string,
  overCard: CardData | undefined,
): DropPositionResult {
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
  sourceStatus: StatusValue,
  targetStatus: StatusValue,
  insertIndex: number,
): Record<string, string[]> {
  const sourceCardIds = board.cardIdsByStatus[sourceStatus] ?? [];
  const targetCardIds = board.cardIdsByStatus[targetStatus] ?? [];

  const newOrder: Record<string, string[]> = { ...board.cardIdsByStatus };

  if (sourceStatus === targetStatus) {
    // Same status group reorder
    const currentIds = [...sourceCardIds];
    const currentIndex = currentIds.indexOf(activeId);
    currentIds.splice(currentIndex, 1);
    // Adjust insert index if we removed from before
    const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
    currentIds.splice(adjustedIndex, 0, activeId);
    newOrder[sourceStatus] = currentIds;
  } else {
    // Cross-status move
    newOrder[sourceStatus] = sourceCardIds.filter((id) => id !== activeId);
    const newTargetIds = [...targetCardIds];
    newTargetIds.splice(insertIndex, 0, activeId);
    newOrder[targetStatus] = newTargetIds;
  }

  return newOrder;
}

/**
 * Compute optimistic card order for priority-based reordering.
 * Handles both same-group reorder and cross-group moves.
 */
export function computeOptimisticCardOrderByPriority(
  board: NormalizedBoard,
  activeId: string,
  targetPriority: string,
  insertIndex: number,
  sourcePriority?: string,
): Record<string, string[]> {
  const actualSource = sourcePriority ?? targetPriority;
  const newOrder: Record<string, string[]> = { ...board.cardIdsByPriority };

  if (actualSource === targetPriority) {
    // Same group reorder
    const cardIds = board.cardIdsByPriority[targetPriority] ?? [];
    const currentIds = [...cardIds];
    const currentIndex = currentIds.indexOf(activeId);
    currentIds.splice(currentIndex, 1);
    const adjustedIndex = currentIndex < insertIndex ? insertIndex - 1 : insertIndex;
    currentIds.splice(adjustedIndex, 0, activeId);
    newOrder[targetPriority] = currentIds;
  } else {
    // Cross-group move
    newOrder[actualSource] = (board.cardIdsByPriority[actualSource] ?? []).filter(
      (id) => id !== activeId,
    );
    const targetIds = [...(board.cardIdsByPriority[targetPriority] ?? [])];
    targetIds.splice(insertIndex, 0, activeId);
    newOrder[targetPriority] = targetIds;
  }

  return newOrder;
}
