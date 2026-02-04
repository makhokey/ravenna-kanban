import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  getFirstCollision,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useRef } from "react";
import { useBoard } from "~/hooks/use-board";
import { useMoveCard } from "~/hooks/use-cards";
import {
  calculateDropPosition,
  calculateDropPositionByPriority,
  computeOptimisticCardOrder,
  computeOptimisticCardOrderByPriority,
} from "~/lib/dnd-position";
import { activeCardAtom, groupByAtom, tempCardOrderAtom } from "~/atoms/board";
import type { CardData, StatusValue } from "~/types/board";
import { isCardDragData } from "~/types/dnd";
import { Column } from "./column";
import { Card } from "./card";

function getTargetStatus(over: {
  id: string | number;
  data: { current?: unknown };
}): StatusValue | null {
  const overCard = (over.data.current as { card?: CardData })?.card;
  if (overCard) return (overCard.status as StatusValue) || "backlog";
  if ((over.data.current as { type?: string })?.type === "column") {
    return over.id as StatusValue;
  }
  return null;
}

export function Kanban() {
  const { data: board } = useBoard();
  const moveCard = useMoveCard();
  const groupBy = useAtomValue(groupByAtom);

  const setActiveCard = useSetAtom(activeCardAtom);
  const setTempCardOrder = useSetAtom(tempCardOrderAtom);
  const tempCardOrder = useAtomValue(tempCardOrderAtom);
  const activeCard = useAtomValue(activeCardAtom);

  // Require 8px movement before drag starts - allows click events to fire
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    }),
  );

  // Ref for collision detection state - caches last over ID to prevent flickering
  const lastOverIdRef = useRef<string | null>(null);

  // Get card IDs by group key based on groupBy mode
  const getCardIdsByGroup = useCallback(
    (groupKey: string): string[] => {
      if (!board) return [];
      if (groupBy === "status") {
        return board.cardIdsByStatus[groupKey as StatusValue] ?? [];
      }
      return board.cardIdsByPriority[groupKey] ?? [];
    },
    [board, groupBy],
  );

  // Custom collision detection optimized for multiple containers
  const collisionDetectionStrategy: CollisionDetection = useCallback(
    (args) => {
      // Start by finding any droppable intersecting with pointer
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);

      let overId = getFirstCollision(intersections, "id") as string | null;

      if (overId != null) {
        // If over a column/group, find the closest card within it
        const groupCardIds = getCardIdsByGroup(overId);
        if (groupCardIds.length > 0) {
          // Get card containers in this column
          const cardContainers = args.droppableContainers.filter(
            (container) =>
              container.id !== overId && groupCardIds.includes(container.id as string),
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
    [getCardIdsByGroup],
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

    const overCard = over.data.current?.card as CardData | undefined;

    if (groupBy === "status") {
      // Status view: allow cross-status moves (changes card status)
      const targetStatus = getTargetStatus(over);
      if (!targetStatus) return;

      const sourceStatus = (draggedCard.status as StatusValue) || "backlog";

      const { newPosition, insertIndex } = calculateDropPosition(
        board,
        activeId,
        targetStatus,
        overId,
        overCard,
      );

      if (sourceStatus !== targetStatus || draggedCard.position !== newPosition) {
        const newOrder = computeOptimisticCardOrder(
          board,
          activeId,
          sourceStatus,
          targetStatus,
          insertIndex,
        );

        setTempCardOrder(newOrder);

        moveCard.mutate(
          {
            cardId: activeId,
            status: targetStatus,
            position: newPosition,
            boardId: board.id,
          },
          {
            onSettled: () => setTempCardOrder(null),
          },
        );
      }
    } else {
      // Priority view: allow cross-priority moves (changes card priority)
      const sourcePriority = draggedCard.priority || "none";

      // Determine target priority group
      let targetPriority: string;
      if (overCard) {
        targetPriority = overCard.priority || "none";
      } else if ((over.data.current as { type?: string })?.type === "column") {
        targetPriority = over.id as string;
      } else {
        return;
      }

      // Calculate position in target priority group
      const { newPosition, insertIndex } = calculateDropPositionByPriority(
        board,
        activeId,
        targetPriority,
        overId,
        overCard,
      );

      if (sourcePriority !== targetPriority || draggedCard.position !== newPosition) {
        const newOrder = computeOptimisticCardOrderByPriority(
          board,
          activeId,
          targetPriority,
          insertIndex,
          sourcePriority,
        );

        setTempCardOrder(newOrder);

        // Convert "none" back to null for DB
        const newPriorityValue = targetPriority === "none" ? null : targetPriority;

        moveCard.mutate(
          {
            cardId: activeId,
            status: (draggedCard.status as StatusValue) || "backlog",
            position: newPosition,
            boardId: board.id,
            priority: newPriorityValue,
          },
          {
            onSettled: () => setTempCardOrder(null),
          },
        );
      }
    }
  };

  const handleDragCancel = () => {
    setActiveCard(null);
    setTempCardOrder(null);
  };

  // Get group order and card IDs based on groupBy mode
  const groupOrder =
    groupBy === "status" ? board.statusOrder : board.priorityOrder;
  const cardIdsByGroup: Record<string, string[]> =
    groupBy === "status" ? board.cardIdsByStatus : board.cardIdsByPriority;

  return (
    <DndContext
      sensors={sensors}
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
      <div className="flex h-full overflow-x-auto overscroll-x-contain px-2 [-webkit-overflow-scrolling:touch]">
        {groupOrder.map((groupKey) => {
          const key = groupKey as string;
          return (
            <Column
              key={key}
              groupKey={key}
              groupBy={groupBy}
              cardIds={tempCardOrder?.[key] ?? cardIdsByGroup[key] ?? []}
              cardsById={board.cardsById}
            />
          );
        })}
      </div>

      <DragOverlay dropAnimation={{ duration: 250, easing: "ease" }}>
        {activeCard && (
          <div className="w-92">
            <Card card={activeCard} dragOverlay dragging />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
