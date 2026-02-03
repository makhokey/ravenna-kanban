import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  MeasuringStrategy,
} from "@dnd-kit/core";
import { useAtomValue, useSetAtom } from "jotai";
import { useBoard } from "~/hooks/use-board";
import { useMoveCard } from "~/hooks/use-cards";
import { calculateDropPosition, computeOptimisticCardOrder } from "~/lib/dnd-position";
import { activeCardAtom, tempCardOrderAtom } from "~/stores/kanban-drag";
import type { CardData } from "~/types/board";
import { isCardDragData } from "~/types/dnd";
import { CardDragOverlay } from "./card-drag-overlay";
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
  const moveCard = useMoveCard();

  const setActiveCard = useSetAtom(activeCardAtom);
  const setTempCardOrder = useSetAtom(tempCardOrderAtom);
  const tempCardOrder = useAtomValue(tempCardOrderAtom);

 

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
      collisionDetection={closestCenter}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.WhileDragging,
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

      <CardDragOverlay />
    </DndContext>
  );
}
