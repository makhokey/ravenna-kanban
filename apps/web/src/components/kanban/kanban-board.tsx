import {
  closestCenter,
  type CollisionDetection,
  defaultDropAnimationSideEffects,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useBoard } from "~/hooks/use-board";
import { useMoveCard } from "~/hooks/use-cards";
import { calculateDropPosition, computeOptimisticCardOrder } from "~/lib/dnd-position";
import { dragStateAtom, INITIAL_DRAG_STATE } from "~/stores/kanban-drag";
import type { CardData } from "~/types/board";
import { isCardDragData } from "~/types/dnd";
import { Card } from "./card";
import { Column } from "./column";

// Temporary state type for optimistic reordering during drag
type TempCardOrder = Record<string, string[]> | null;

// Configure smooth drop animation with opacity side effect
const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

// Custom collision detection optimized for kanban columns
// Handles: empty column drops, cross-column card snapping
const collisionDetection: CollisionDetection = (args) => {
  // First: check if pointer is directly inside a droppable (column or card)
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    // If pointer is in a column, find the closest card within
    const columnCollision = pointerCollisions.find(
      (c) => (c.data?.current as { type?: string })?.type === "column",
    );
    if (columnCollision) {
      // Get cards within this column and find closest
      const cardsInColumn = args.droppableContainers.filter(
        (c) =>
          (c.data?.current as { card?: CardData })?.card?.columnId === columnCollision.id,
      );
      if (cardsInColumn.length > 0) {
        const closest = closestCenter({
          ...args,
          droppableContainers: cardsInColumn,
        });
        if (closest.length > 0) return closest;
      }
      // Empty column - return the column itself
      return [columnCollision];
    }
    return pointerCollisions;
  }

  // Second: check rect intersection (dragged item overlaps droppable)
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }

  // Fallback: closest center
  return closestCenter(args);
};

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
  const setDragState = useSetAtom(dragStateAtom);
  const moveCard = useMoveCard();

  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  // Temporary optimistic state to prevent flicker during drop animation
  const [tempCardOrder, setTempCardOrder] = useState<TempCardOrder>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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
    setDragState({ activeId: event.active.id as string });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    // Delay dragState reset to let optimistic update process first
    requestAnimationFrame(() => {
      setDragState(INITIAL_DRAG_STATE);
    });

    if (!over || !board || !isCardDragData(active.data.current)) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeCard = board.cardsById[activeId];
    if (!activeCard) return;

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
    if (activeCard.columnId !== targetColumnId || activeCard.position !== newPosition) {
      // Compute optimistic card order immediately to prevent flicker
      const newOrder = computeOptimisticCardOrder(
        board,
        activeId,
        activeCard.columnId,
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
    setDragState(INITIAL_DRAG_STATE);
    setActiveCard(null);
  };

  return (
    <DndContext
      autoScroll={{ threshold: { x: 0.2, y: 0 }, acceleration: 5 }}
      sensors={sensors}
      collisionDetection={collisionDetection}
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
            activeId={id === activeCard?.columnId ? activeCard.id : null}
          />
        ))}
      </div>

      {createPortal(
        <DragOverlay
          modifiers={[restrictToWindowEdges]}
          dropAnimation={dropAnimationConfig}
        >
          {activeCard && <Card card={activeCard} isDragOverlay />}
        </DragOverlay>,
        document.body,
      )}
    </DndContext>
  );
}
