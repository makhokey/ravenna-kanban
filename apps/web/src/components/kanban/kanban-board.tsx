import {
  closestCenter,
  defaultDropAnimationSideEffects,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useSetAtom } from "jotai";
import { useState } from "react";
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
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
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
    setDragState({
      activeId: event.active.id as string,
      targetColumnId: null,
    });
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

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over || !board) {
      setDragState((prev) => ({ ...prev, targetColumnId: null }));
      return;
    }

    const targetColumnId = getTargetColumnId(over);
    setDragState((prev) => ({ ...prev, targetColumnId }));
  };

  const handleDragCancel = () => {
    setDragState(INITIAL_DRAG_STATE);
    setActiveCard(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always,
        },
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
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

      <DragOverlay
        modifiers={[restrictToWindowEdges]}
        dropAnimation={dropAnimationConfig}
      >
        {activeCard && <Card card={activeCard} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  );
}
