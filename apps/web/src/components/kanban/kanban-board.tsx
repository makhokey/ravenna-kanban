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
import { generateKeyBetween } from "fractional-indexing";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useBoard } from "~/hooks/use-board";
import { useMoveCard } from "~/hooks/use-cards";
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

    // Determine target column - either from over card or if over a column directly
    const overCard = over.data.current?.card as CardData | undefined;
    const targetColumnId = getTargetColumnId(over);
    if (!targetColumnId) return;

    const sourceColumnId = activeCard.columnId;
    const targetCardIds = board.cardIdsByColumn[targetColumnId] ?? [];
    const sourceCardIds = board.cardIdsByColumn[sourceColumnId] ?? [];

    // Calculate new position using fractional indexing
    let newPosition: string;
    let insertIndex: number;

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
        newPosition = generateKeyBetween(overCard.position, afterCard?.position ?? null);
        insertIndex = overIndex + 1;
      } else {
        // Insert before over card
        const beforeId = targetCardIds[overIndex - 1];
        const beforeCard = beforeId ? board.cardsById[beforeId] : null;
        newPosition = generateKeyBetween(beforeCard?.position ?? null, overCard.position);
        insertIndex = overIndex;
      }
    } else {
      // Dropped on empty column - add at end
      const lastId = targetCardIds[targetCardIds.length - 1];
      const lastCard = lastId ? board.cardsById[lastId] : null;
      newPosition = generateKeyBetween(lastCard?.position ?? null, null);
      insertIndex = targetCardIds.length;
    }

    // Only mutate if something changed
    if (activeCard.columnId !== targetColumnId || activeCard.position !== newPosition) {
      // Compute optimistic card order immediately to prevent flicker
      const newOrder: TempCardOrder = { ...board.cardIdsByColumn };

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

      // Set temp order immediately - this prevents the flicker
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
