import { useDndContext, useDroppable } from "@dnd-kit/core";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { useCallback, useMemo } from "react";
import { getColumnStatus } from "~/components/shared/card-schema";
import { StatusIcon } from "~/components/shared/status-icon";
import { useDeleteCard } from "~/hooks/use-cards";
import { useFilteredCardIds } from "~/hooks/use-filtered-cards";
import {
  activeColumnIdAtom,
  dialogAtom,
  priorityFiltersAtom,
  tagFiltersAtom,
} from "~/atoms/board";
import type { CardData, ColumnData } from "~/types/board";
import { VirtualizedCardList } from "./virtualized-card-list";

interface ColumnProps {
  column: ColumnData;
  cardIds: string[];
  cardsById: Record<string, CardData>;
}

export function Column({ column, cardIds, cardsById }: ColumnProps) {
  const setDialog = useSetAtom(dialogAtom);
  const priorityFilters = useAtomValue(priorityFiltersAtom);
  const tagFilters = useAtomValue(tagFiltersAtom);

  // Make the column a droppable target for cross-column moves
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  // Get current drag state - only highlight for cross-column drops
  const { over } = useDndContext();
  const activeColumnId = useAtomValue(activeColumnIdAtom);
  const isOverThisColumn =
    over?.id === column.id ||
    (over?.data.current as { card?: { columnId: string } })?.card?.columnId === column.id;
  const isOver = isOverThisColumn && activeColumnId !== column.id;

  // Get status icon for column header
  const columnStatus = useMemo(() => getColumnStatus(column.name), [column.name]);

  // Filter cards based on priority and tag filters
  const filteredCardIds = useFilteredCardIds(
    cardIds,
    cardsById,
    priorityFilters,
    tagFilters,
  );

  const deleteCard = useDeleteCard();

  const handleDeleteCard = useCallback(
    (cardId: string) => deleteCard.mutate({ id: cardId }),
    [deleteCard],
  );

  return (
    <div
      ref={setDroppableRef}
      className={cn(
        "flex h-full w-92 shrink-0 flex-col border-x border-transparent py-2 ",
        isOver && "border-dashed border-primary duration-300 ease-in-out",
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 pb-2">
        <div className="flex items-center gap-2">
          {columnStatus && <StatusIcon status={columnStatus} size={12} />}
          <p className="text-sm font-medium">{column.name}</p>
          <span className="text-muted-foreground text-xs">{filteredCardIds.length}</span>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setDialog({ open: true, mode: "create", columnId: column.id })}
          aria-label="Add card"
        >
          <Plus className="size-3" />
        </Button>
      </div>

      <div className="group/column flex flex-1 flex-col overflow-hidden">
        <VirtualizedCardList
          cardIds={filteredCardIds}
          cardsById={cardsById}
          onDelete={handleDeleteCard}
        />
      </div>
    </div>
  );
}
