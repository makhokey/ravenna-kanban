import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  getFirstCollision,
  MeasuringStrategy,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
import { useBoard } from "~/hooks/use-board";
import { useMoveCard } from "~/hooks/use-cards";
import { calculateDropPosition, computeOptimisticCardOrder } from "~/lib/dnd-position";
import { activeCardAtom, tempCardOrderAtom } from "~/stores/kanban-drag";
import type { CardData } from "~/types/board";
import { isCardDragData } from "~/types/dnd";
import { Column } from "./column";
import { Card } from "./card";

function getTargetColumnId(over: {
  id: string | number;
  data: { current?: unknown };
}): string | null {
  const overCard = (over.data.current as { card?: CardData })?.card;
  if (overCard) return overCard.columnId;
  if ((over.data.current as { type?: string })?.type === "column") {
    return over.id as string;
  }
  return null;
}

export function Board() {
  const { data: board } = useBoard();
  const moveCard = useMoveCard();

  const setActiveCard = useSetAtom(activeCardAtom);
  const setTempCardOrder = useSetAtom(tempCardOrderAtom);
  const tempCardOrder = useAtomValue(tempCardOrderAtom);
  const activeCard = useAtomValue(activeCardAtom);

  // Ref for collision detection state - caches last over ID to prevent flickering
  const lastOverIdRef = useRef<string | null>(null);

  // Custom collision detection optimized for multiple containers
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      // Start by finding any droppable intersecting with pointer
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);

      let overId = getFirstCollision(intersections, "id") as string | null;

      if (overId != null) {
        // If over a column, find the closest card within it
        const columnCardIds = board?.cardIdsByColumn[overId];
        if (columnCardIds && columnCardIds.length > 0) {
          // Get card containers in this column
          const cardContainers = args.droppableContainers.filter(
            (container) =>
              container.id !== overId && columnCardIds.includes(container.id as string),
          );

          // Check if pointer is below all cards in the column
          const pointerY = args.pointerCoordinates?.y ?? 0;
          const maxCardBottom = cardContainers.reduce((max, container) => {
            const rect = container.rect.current;
            if (!rect) return max;
            return Math.max(max, rect.top + rect.height);
          }, 0);

          // If pointer is below all cards, keep column as target (drop at end)
          if (pointerY > maxCardBottom) {
            // Keep overId as the column
          } else {
            // Find closest card
            overId =
              (closestCenter({
                ...args,
                droppableContainers: cardContainers,
              })[0]?.id as string | undefined) ?? overId;
          }
        }

        lastOverIdRef.current = overId;
        return [{ id: overId }];
      }

      // Return last match to prevent flickering
      return lastOverIdRef.current ? [{ id: lastOverIdRef.current }] : [];
    },
    [board],
  );

  if (!board) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          No board found. Create one to get started.
        </p>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    if (!isCardDragData(event.active.data.current)) return;
    setActiveCard(event.active.data.current.card);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || !board || !isCardDragData(active.data.current)) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const draggedCard = board.cardsById[activeId];
    if (!draggedCard) return;

    // Determine target column
    const overCard = over.data.current?.card as CardData | undefined;
    const targetColumnId = getTargetColumnId(over);
    if (!targetColumnId) return;

    // Calculate new position using fractional indexing
    const { newPosition, insertIndex } = calculateDropPosition(
      board,
      activeId,
      targetColumnId,
      overId,
      overCard,
    );

    // Only mutate if something changed
    if (draggedCard.columnId !== targetColumnId || draggedCard.position !== newPosition) {
      // Compute optimistic card order immediately to prevent flicker
      const newOrder = computeOptimisticCardOrder(
        board,
        activeId,
        draggedCard.columnId,
        targetColumnId,
        insertIndex,
      );

      setTempCardOrder(newOrder);

      moveCard.mutate(
        {
          cardId: activeId,
          columnId: targetColumnId,
          position: newPosition,
        },
        {
          onSettled: () => {
            // Clear temp order after mutation completes (success or error)
            setTempCardOrder(null);
          },
        },
      );
    }
  };

  const handleDragCancel = () => {
    setActiveCard(null);
    setTempCardOrder(null);
  };

  return (
    <DndContext
      collisionDetection={collisionDetectionStrategy}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full gap-2 overflow-x-auto overscroll-x-contain p-3 [-webkit-overflow-scrolling:touch]">
        {board.columnIds.map((id) => (
          <Column
            key={id}
            column={board.columnsById[id]!}
            cardIds={tempCardOrder?.[id] ?? board.cardIdsByColumn[id] ?? []}
            cardsById={board.cardsById}
          />
        ))}
      </div>

         <DragOverlay dropAnimation={{ duration: 250, easing: "ease" }}>
      {activeCard && <Card card={activeCard} dragOverlay dragging />}
    </DragOverlay>
    </DndContext>
  );
}
