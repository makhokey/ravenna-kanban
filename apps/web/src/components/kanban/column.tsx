import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { useCallback, useMemo } from "react";
import { getColumnStatus } from "~/components/shared/card-schema";
import { StatusIcon } from "~/components/shared/status-icon";
import { useDeleteCard } from "~/hooks/use-cards";
import { useFilteredCardIds } from "~/hooks/use-filtered-cards";
import { dialogAtom, priorityFiltersAtom, tagFiltersAtom } from "~/stores/board";
import { activeIdAtom, targetColumnIdAtom } from "~/stores/kanban-drag";
import type { CardData, ColumnData } from "~/types/board";
import { Card } from "./card";

interface ColumnProps {
  column: ColumnData;
  cardIds: string[]; // Already sorted
  cardsById: Record<string, CardData>;
}

export function Column({ column, cardIds, cardsById }: ColumnProps) {
  const setDialog = useSetAtom(dialogAtom);
  const priorityFilters = useAtomValue(priorityFiltersAtom);
  const tagFilters = useAtomValue(tagFiltersAtom);

  // Use granular selectors for drag state to minimize re-renders
  const activeId = useAtomValue(activeIdAtom);
  const targetColumnId = useAtomValue(targetColumnIdAtom);

  // Get status icon for column header
  const columnStatus = useMemo(() => getColumnStatus(column.name), [column.name]);

  // Filter cards based on priority and tag filters
  const filteredCardIds = useFilteredCardIds(
    cardIds,
    cardsById,
    priorityFilters,
    tagFilters,
  );

  // Visual feedback state
  const isDropTarget = activeId !== null && targetColumnId === column.id;

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
        "bg-card flex h-full w-82 flex-shrink-0 flex-col rounded-lg px-2",
        isDropTarget && "bg-accent",
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between gap-2 p-2">
        <div className="flex items-center gap-2">
          {columnStatus && <StatusIcon status={columnStatus} size={16} />}
          <p className="text-sm font-medium">{column.name}</p>
          <span className="text-muted-foreground text-xs">{filteredCardIds.length}</span>
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
      <div className="group/column flex flex-1 flex-col gap-2 overflow-y-auto pt-0">
        <SortableContext items={filteredCardIds} strategy={verticalListSortingStrategy}>
          {filteredCardIds.map((id) => {
            const card = cardsById[id];
            if (!card) return null;

            return <Card key={id} card={card} onDelete={handleDeleteCard} />;
          })}
        </SortableContext>

        {/* Add Card Button - visible on column hover */}
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 transition-opacity group-hover/column:opacity-100"
          onClick={() => setDialog({ open: true, mode: "create", columnId: column.id })}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
