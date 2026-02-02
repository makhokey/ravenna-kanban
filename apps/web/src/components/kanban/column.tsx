import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { useCallback } from "react";
import { useDeleteCard } from "~/hooks/use-cards";
import {
  activeIdAtom,
  dialogAtom,
  insertIndexAtom,
  targetColumnIdAtom,
} from "~/stores/kanban";
import type { CardData, ColumnData } from "~/types/board";
import { Card } from "./card";

// Match card h-32 (128px) + gap-2 (8px) = 136px = 8.5rem
const CARD_SLIDE_OFFSET = "8.5rem";

interface ColumnProps {
  column: ColumnData;
  cardIds: string[]; // Already sorted
  cardsById: Record<string, CardData>;
}

export function Column({ column, cardIds, cardsById }: ColumnProps) {
  const setDialog = useSetAtom(dialogAtom);

  // Use granular selectors for drag state to minimize re-renders
  const activeId = useAtomValue(activeIdAtom);
  const targetColumnId = useAtomValue(targetColumnIdAtom);
  const insertIndex = useAtomValue(insertIndexAtom);

  // Visual feedback state
  const isDropTarget = activeId !== null && targetColumnId === column.id;
  const isDraggingFromThisColumn = cardIds.includes(activeId ?? "");

  const deleteCard = useDeleteCard();

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      deleteCard.mutate({ id: cardId });
    },
    [deleteCard],
  );

  return (
    <div
      className={cn(
        "bg-accent flex h-full w-72 flex-shrink-0 flex-col rounded-lg",
        isDropTarget && "bg-primary",
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{column.name}</p>
          <span className="text-muted-foreground text-xs">{cardIds.length}</span>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setDialog({ open: true, mode: "create", columnId: column.id })}
          aria-label="Add card"
        >
          <Plus />
        </Button>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0">
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cardIds.map((id, idx) => {
            const card = cardsById[id];
            if (!card) return null;

            // Collapse card in source column when dragging to different column
            const isDraggingToOtherColumn =
              id === activeId && targetColumnId !== null && targetColumnId !== column.id;

            // Calculate if this card should slide down to make room
            // Only slide cards after insertion point when dragging from another column
            const shouldSlide =
              isDropTarget &&
              !isDraggingFromThisColumn &&
              insertIndex !== null &&
              idx >= insertIndex;

            return (
              <div
                key={id}
                className={cn(
                  "transition-all duration-150 ease-out",
                  isDraggingToOtherColumn && "-my-1 h-0 opacity-0",
                )}
                style={{
                  transform: shouldSlide
                    ? `translateY(${CARD_SLIDE_OFFSET})`
                    : "translateY(0)",
                }}
              >
                <Card card={card} onDelete={handleDeleteCard} />
              </div>
            );
          })}
        </SortableContext>

        {/* Add Card Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDialog({ open: true, mode: "create", columnId: column.id })}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
