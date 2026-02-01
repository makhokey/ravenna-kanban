import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
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
import { dragStateAtom, INITIAL_DRAG_STATE } from "~/stores/kanban";
import type { CardData } from "~/types/board";
import { isCardDragData } from "~/types/dnd";
import { Card } from "./card";
import { Column } from "./column";

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
      ...INITIAL_DRAG_STATE,
      activeId: event.active.id as string,
      type: "card",
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

    const targetCardIds = board.cardIdsByColumn[targetColumnId] ?? [];

    // Calculate new position using fractional indexing
    let newPosition: string;

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
      } else {
        // Insert before over card
        const beforeId = targetCardIds[overIndex - 1];
        const beforeCard = beforeId ? board.cardsById[beforeId] : null;
        newPosition = generateKeyBetween(beforeCard?.position ?? null, overCard.position);
      }
    } else {
      // Dropped on empty column - add at end
      const lastId = targetCardIds[targetCardIds.length - 1];
      const lastCard = lastId ? board.cardsById[lastId] : null;
      newPosition = generateKeyBetween(lastCard?.position ?? null, null);
    }

    // Only mutate if something changed
    if (activeCard.columnId !== targetColumnId || activeCard.position !== newPosition) {
      moveCard.mutate({
        cardId: activeId,
        columnId: targetColumnId,
        position: newPosition,
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !board || !isCardDragData(active.data.current)) {
      setDragState((prev) => ({ ...prev, targetColumnId: null, insertIndex: null }));
      return;
    }

    const overId = over.id as string;

    // Determine target column
    const overCard = over.data.current?.card as CardData | undefined;
    const targetColumnId = getTargetColumnId(over);

    if (!targetColumnId) {
      setDragState((prev) => ({ ...prev, targetColumnId: null, insertIndex: null }));
      return;
    }

    // Calculate insertion index
    const targetCardIds = board.cardIdsByColumn[targetColumnId] ?? [];
    let insertIndex: number;

    if (overCard) {
      insertIndex = targetCardIds.indexOf(overId);
    } else {
      // Hovering over empty column area - insert at end
      insertIndex = targetCardIds.length;
    }

    setDragState((prev) => ({ ...prev, targetColumnId, insertIndex }));
  };

  const handleDragCancel = () => {
    setDragState(INITIAL_DRAG_STATE);
    setActiveCard(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
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

      <DragOverlay modifiers={[restrictToWindowEdges]} dropAnimation={null}>
        {activeCard && <Card card={activeCard} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  );
}
