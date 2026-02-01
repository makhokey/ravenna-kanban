import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DropAnimation,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { generateKeyBetween } from "fractional-indexing";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useBoard } from "~/hooks/use-board";
import { useMoveCard } from "~/hooks/use-cards";
import type { CardData } from "~/types/board";
import { dragStateAtom } from "~/stores/kanban";
import { Card } from "./card";
import { Column } from "./column";

// Drop animation config for smooth card placement
const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

export function Board() {
  const { data: board } = useBoard();
  const setDragState = useSetAtom(dragStateAtom);
  const moveCard = useMoveCard();

  const [activeCard, setActiveCard] = useState<CardData | null>(null);

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
    const { active } = event;
    const type = active.data.current?.type;

    if (type === "card") {
      setActiveCard(active.data.current?.card);
      setDragState({ activeId: active.id as string, type: "card" });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType !== "card") return;

    // Find source and destination columns
    const activeCard = active.data.current?.card as CardData;
    let overColumnId: string;

    if (overType === "column") {
      overColumnId = over.id as string;
    } else if (overType === "card") {
      overColumnId = (over.data.current?.card as CardData).columnId;
    } else {
      return;
    }

    if (activeCard.columnId !== overColumnId) {
      // Update the active card's column (optimistic update will be handled by mutation)
      setActiveCard((prev) => (prev ? { ...prev, columnId: overColumnId } : null));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDragState({ activeId: null, type: null });
    setActiveCard(null);

    if (!over || active.data.current?.type !== "card") return;

    const activeCard = active.data.current.card as CardData;
    const overCard = over.data.current?.card as CardData | undefined;
    const targetColumnId = overCard?.columnId ?? (over.id as string);

    // Cards in target column, excluding the dragged card
    const targetCardIds = board.cardIdsByColumn[targetColumnId] ?? [];
    const otherCardIds = targetCardIds.filter((id) => id !== activeCard.id);

    // Determine insertion index
    const overIndex = overCard ? otherCardIds.indexOf(overCard.id) : -1;
    let insertIndex: number;

    if (overIndex === -1) {
      insertIndex = otherCardIds.length; // Append at end
    } else {
      // Determine if inserting before or after the target card
      const isSameColumn = activeCard.columnId === targetColumnId;
      const insertAfter = isSameColumn
        ? targetCardIds.indexOf(activeCard.id) < targetCardIds.indexOf(overCard!.id)
        : ((active.rect.current.translated?.top ?? 0) + (active.rect.current.translated?.height ?? 0) / 2) >
          ((over.rect?.top ?? 0) + (over.rect?.height ?? 0) / 2);

      insertIndex = insertAfter ? overIndex + 1 : overIndex;
    }

    // Calculate fractional position between neighbors
    const getPosition = (id: string | undefined) => id ? board.cardsById[id]?.position ?? null : null;
    const newPosition = generateKeyBetween(
      getPosition(otherCardIds[insertIndex - 1]),
      getPosition(otherCardIds[insertIndex]),
    );

    // Mutate only if position or column changed
    if (activeCard.columnId !== targetColumnId || activeCard.position !== newPosition) {
      moveCard.mutate({ cardId: activeCard.id, columnId: targetColumnId, position: newPosition });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto overscroll-x-contain p-4 [-webkit-overflow-scrolling:touch]">
        {board.columnIds.map((id) => (
          <Column
            key={id}
            column={board.columnsById[id]!}
            cardIds={board.cardIdsByColumn[id] ?? []}
            cardsById={board.cardsById}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimationConfig} modifiers={[restrictToWindowEdges]}>
        {activeCard && <Card card={activeCard} onDelete={() => {}} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  );
}
