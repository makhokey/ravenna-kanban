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
import type { Priority } from "@repo/db/types";
import { useAtomValue, useSetAtom } from "jotai";
import { memo, useCallback, useRef } from "react";
import {
  activeCardAtom,
  groupByAtom,
  hiddenPriorityColumnsAtom,
  hiddenStatusColumnsAtom,
  priorityFiltersAtom,
  sortDirectionAtom,
  sortFieldAtom,
  tagFiltersAtom,
  tempCardOrderAtom,
  type SortDirection,
  type SortField,
} from "~/atoms/board-atoms";
import { useBoard } from "~/hooks/use-board";
import { useMoveCard } from "~/hooks/use-cards";
import { useFilteredCardIds } from "~/hooks/use-filtered-cards";
import {
  calculateDropPosition,
  calculateDropPositionByPriority,
  computeOptimisticCardOrder,
  computeOptimisticCardOrderByPriority,
} from "~/lib/dnd-utils";
import type { CardData, StatusValue } from "~/types/board-types";
import { isCardDragData } from "~/types/dnd-types";
import { Card } from "./card";
import { KanbanColumn } from "./kanban-column";

// Helper to extract target status from drop event
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

// Helper to extract target priority from drop event
function getTargetPriority(over: {
  id: string | number;
  data: { current?: unknown };
}): Priority | "none" | null {
  const overCard = (over.data.current as { card?: CardData })?.card;
  if (overCard) return (overCard.priority || "none") as Priority | "none";
  if ((over.data.current as { type?: string })?.type === "column") {
    return over.id as Priority | "none";
  }
  return null;
}

export function KanbanView() {
  const { data: board } = useBoard();
  const moveCard = useMoveCard();
  const groupBy = useAtomValue(groupByAtom);

  const setActiveCard = useSetAtom(activeCardAtom);
  const setTempCardOrder = useSetAtom(tempCardOrderAtom);
  const tempCardOrder = useAtomValue(tempCardOrderAtom);
  const activeCard = useAtomValue(activeCardAtom);

  // Read filters and sort settings once at top level instead of in each column
  const priorityFilters = useAtomValue(priorityFiltersAtom);
  const tagFilters = useAtomValue(tagFiltersAtom);
  const sortField = useAtomValue(sortFieldAtom);
  const sortDirection = useAtomValue(sortDirectionAtom);

  // Hidden columns
  const hiddenStatusColumns = useAtomValue(hiddenStatusColumnsAtom);
  const hiddenPriorityColumns = useAtomValue(hiddenPriorityColumnsAtom);

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
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0 ? pointerIntersections : rectIntersection(args);

      let overId = getFirstCollision(intersections, "id") as string | null;

      // No collision found - return cached value to prevent flickering
      if (overId == null) {
        return lastOverIdRef.current ? [{ id: lastOverIdRef.current }] : [];
      }

      // If over a column/group, find the closest card within it
      const groupCardIds = getCardIdsByGroup(overId);
      if (groupCardIds.length > 0) {
        const cardContainers = args.droppableContainers.filter(
          (container) =>
            container.id !== overId && groupCardIds.includes(container.id as string),
        );

        // Check if pointer is below all cards (drop at end of column)
        const pointerY = args.pointerCoordinates?.y ?? 0;
        const maxCardBottom = cardContainers.reduce((max, container) => {
          const rect = container.rect.current;
          return rect ? Math.max(max, rect.top + rect.height) : max;
        }, 0);

        // Find closest card if pointer is not below all cards
        if (pointerY <= maxCardBottom) {
          overId =
            (closestCenter({ ...args, droppableContainers: cardContainers })[0]?.id as
              | string
              | undefined) ?? overId;
        }
      }

      lastOverIdRef.current = overId;
      return [{ id: overId }];
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

  // Handle status-based drop (cross-status moves)
  const handleStatusDrop = (
    activeId: string,
    overId: string,
    draggedCard: CardData,
    overCard: CardData | undefined,
    over: DragEndEvent["over"],
  ) => {
    const targetStatus = getTargetStatus(over!);
    if (!targetStatus) return;

    const sourceStatus = (draggedCard.status as StatusValue) || "backlog";
    const { newPosition, insertIndex } = calculateDropPosition(
      board,
      activeId,
      targetStatus,
      overId,
      overCard,
    );

    if (sourceStatus === targetStatus && draggedCard.position === newPosition) return;

    setTempCardOrder(
      computeOptimisticCardOrder(
        board,
        activeId,
        sourceStatus,
        targetStatus,
        insertIndex,
      ),
    );

    moveCard.mutate(
      {
        cardId: activeId,
        status: targetStatus,
        position: newPosition,
        boardId: board.id,
      },
      { onSettled: () => setTempCardOrder(null) },
    );
  };

  // Handle priority-based drop (cross-priority moves)
  const handlePriorityDrop = (
    activeId: string,
    overId: string,
    draggedCard: CardData,
    overCard: CardData | undefined,
    over: DragEndEvent["over"],
  ) => {
    const targetPriority = getTargetPriority(over!);
    if (!targetPriority) return;

    const sourcePriority = (draggedCard.priority || "none") as Priority | "none";
    const { newPosition, insertIndex } = calculateDropPositionByPriority(
      board,
      activeId,
      targetPriority,
      overId,
      overCard,
    );

    if (sourcePriority === targetPriority && draggedCard.position === newPosition) return;

    setTempCardOrder(
      computeOptimisticCardOrderByPriority(
        board,
        activeId,
        targetPriority,
        insertIndex,
        sourcePriority,
      ),
    );

    moveCard.mutate(
      {
        cardId: activeId,
        status: (draggedCard.status as StatusValue) || "backlog",
        position: newPosition,
        boardId: board.id,
        priority: targetPriority,
      },
      { onSettled: () => setTempCardOrder(null) },
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || !board || !isCardDragData(active.data.current)) return;

    const activeId = active.id as string;
    const draggedCard = board.cardsById[activeId];
    if (!draggedCard) return;

    const overId = over.id as string;
    const overCard = over.data.current?.card as CardData | undefined;

    if (groupBy === "status") {
      handleStatusDrop(activeId, overId, draggedCard, overCard, over);
    } else {
      handlePriorityDrop(activeId, overId, draggedCard, overCard, over);
    }
  };

  const handleDragCancel = () => {
    setActiveCard(null);
    setTempCardOrder(null);
  };

  // Get group order and card IDs based on groupBy mode
  const groupOrder = groupBy === "status" ? board.statusOrder : board.priorityOrder;
  const cardIdsByGroup: Record<string, string[]> =
    groupBy === "status" ? board.cardIdsByStatus : board.cardIdsByPriority;

  // Filter out hidden columns
  const hiddenColumns = groupBy === "status" ? hiddenStatusColumns : hiddenPriorityColumns;
  const visibleGroupOrder = groupOrder.filter((key) => !hiddenColumns.has(key as string));

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
        {visibleGroupOrder.map((groupKey) => {
          const key = groupKey as string;
          const cardIds = tempCardOrder?.[key] ?? cardIdsByGroup[key] ?? [];
          return (
            <FilteredColumn
              key={key}
              groupKey={key}
              groupBy={groupBy}
              cardIds={cardIds}
              cardsById={board.cardsById}
              priorityFilters={priorityFilters}
              tagFilters={tagFilters}
              sortField={sortField}
              sortDirection={sortDirection}
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

// Internal component: Memoized wrapper that filters cardIds before passing to column
// Prevents columns from re-rendering when filters change if their filtered result is the same
interface FilteredColumnProps {
  groupKey: string;
  groupBy: "status" | "priority";
  cardIds: string[];
  cardsById: Record<string, CardData>;
  priorityFilters: Set<string>;
  tagFilters: Set<string>;
  sortField: SortField;
  sortDirection: SortDirection;
}

const FilteredColumn = memo(function FilteredColumn({
  groupKey,
  groupBy,
  cardIds,
  cardsById,
  priorityFilters,
  tagFilters,
  sortField,
  sortDirection,
}: FilteredColumnProps) {
  const filteredCardIds = useFilteredCardIds(
    cardIds,
    cardsById,
    priorityFilters,
    tagFilters,
    sortField,
    sortDirection,
  );

  return (
    <KanbanColumn
      groupKey={groupKey}
      groupBy={groupBy}
      cardIds={filteredCardIds}
      cardsById={cardsById}
    />
  );
});
