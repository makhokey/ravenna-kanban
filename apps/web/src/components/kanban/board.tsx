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
import { useAtom } from "jotai";
import { useState } from "react";
import { useBoard } from "~/hooks/use-board";
import { useMoveCard } from "~/hooks/use-cards";
import { comparePosition } from "~/lib/position";
import { dragStateAtom } from "~/stores/kanban";
import { Card } from "./card";
import { Column } from "./column";

interface CardData {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  tags: string | null;
  position: string; // Fractional index
  columnId: string;
}

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
  const [dragState, setDragState] = useAtom(dragStateAtom);
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

    if (!over) return;
    if (active.data.current?.type !== "card") return;

    const activeCard = active.data.current.card as CardData;
    const overType = over.data.current?.type;

    // Determine target column
    const targetColumnId =
      overType === "column"
        ? (over.id as string)
        : (over.data.current?.card as CardData).columnId;

    // Get sorted cards in target column (excluding the dragged card)
    const targetColumn = board!.columns.find((col) => col.id === targetColumnId);
    const sortedCards = [...(targetColumn?.cards ?? [])]
      .filter((c) => c.id !== activeCard.id)
      .sort((a, b) => comparePosition(a.position, b.position));

    // Find insertion index
    let insertIndex: number;
    if (overType === "column") {
      insertIndex = sortedCards.length; // Append at end
    } else {
      const overCard = over.data.current?.card as CardData;
      const overIndex = sortedCards.findIndex((c) => c.id === overCard.id);

      if (overIndex === -1) {
        insertIndex = sortedCards.length;
      } else {
        // Determine insert position based on drag direction
        const isSameColumn = activeCard.columnId === targetColumnId;
        const activeIndex = isSameColumn
          ? sortedCards.findIndex((c) => c.id === activeCard.id)
          : -1;

        // If dragging down (or cross-column), insert after over card
        // If dragging up, insert before over card
        const isDraggingDown = !isSameColumn || activeIndex < overIndex;
        insertIndex = isDraggingDown ? overIndex + 1 : overIndex;
      }
    }

    // Calculate fractional position between neighbors
    const prevCard = sortedCards[insertIndex - 1];
    const nextCard = sortedCards[insertIndex];
    const newPosition = generateKeyBetween(
      prevCard?.position ?? null,
      nextCard?.position ?? null,
    );

    // Only mutate if something changed
    if (activeCard.columnId !== targetColumnId || activeCard.position !== newPosition) {
      moveCard.mutate({
        cardId: activeCard.id,
        columnId: targetColumnId,
        position: newPosition,
      });
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
        {board.columns.map((column) => (
          <Column key={column.id} column={column} />
        ))}
      </div>

      <DragOverlay
        dropAnimation={dropAnimationConfig}
        modifiers={[restrictToWindowEdges]}
      >
        {dragState.type === "card" && activeCard && (
          <Card card={activeCard} onDelete={() => {}} isDragOverlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}
