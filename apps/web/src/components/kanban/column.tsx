import { useDndContext, useDroppable } from "@dnd-kit/core";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "~/components/shared/card-schema";
import { StatusIcon } from "~/components/shared/status-icon";
import { PriorityIcon } from "~/components/shared/priority-icon";
import { useFilteredCardIds } from "~/hooks/use-filtered-cards";
import {
  activeGroupKeyAtom,
  dialogAtom,
  priorityFiltersAtom,
  tagFiltersAtom,
} from "~/atoms/board";
import type { CardData, GroupBy, StatusValue } from "~/types/board";
import { VirtualizedCardList } from "./virtualized-card-list";

interface ColumnProps {
  groupKey: string;
  groupBy: GroupBy;
  cardIds: string[];
  cardsById: Record<string, CardData>;
}

// Get display name for a group
function getGroupName(groupKey: string, groupBy: GroupBy): string {
  if (groupBy === "status") {
    const option = STATUS_OPTIONS.find((opt) => opt.value === groupKey);
    return option?.label ?? groupKey;
  }
  if (groupKey === "none") return "No Priority";
  const option = PRIORITY_OPTIONS.find((opt) => opt.value === groupKey);
  return option?.label ?? groupKey;
}

export function Column({ groupKey, groupBy, cardIds, cardsById }: ColumnProps) {
  const setDialog = useSetAtom(dialogAtom);
  const priorityFilters = useAtomValue(priorityFiltersAtom);
  const tagFilters = useAtomValue(tagFiltersAtom);

  // Make the column a droppable target for cross-column moves
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: groupKey,
    data: { type: "column", groupKey },
  });

  // Get current drag state - only highlight for cross-group drops
  const { over } = useDndContext();
  const activeGroupKey = useAtomValue(activeGroupKeyAtom);
  const overCardData = over?.data.current as { card?: { status: string; priority: string | null } } | undefined;
  const isOverThisGroup =
    over?.id === groupKey ||
    (groupBy === "status"
      ? overCardData?.card?.status === groupKey
      : (overCardData?.card?.priority || "none") === groupKey);
  const isOver = isOverThisGroup && activeGroupKey !== groupKey;

  // Get display name for the column header
  const groupName = useMemo(() => getGroupName(groupKey, groupBy), [groupKey, groupBy]);

  // Filter cards based on priority and tag filters
  const filteredCardIds = useFilteredCardIds(
    cardIds,
    cardsById,
    priorityFilters,
    tagFilters,
  );

  // Only show add button in status view
  const showAddButton = groupBy === "status";

  return (
    <div
      ref={setDroppableRef}
      className={cn(
        "flex h-full w-92 shrink-0 flex-col border-x border-transparent pt-2 ",
        isOver && "border-dashed border-primary duration-300 ease-in-out",
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {groupBy === "status" ? (
            <StatusIcon status={groupKey as StatusValue} />
          ) : (
            <PriorityIcon priority={groupKey === "none" ? null : groupKey} />
          )}
          <p className="text-sm font-medium">{groupName}</p>
          <span className="text-muted-foreground text-xs">{filteredCardIds.length}</span>
        </div>

        {showAddButton && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() =>
              setDialog({ open: true, mode: "create", status: groupKey as StatusValue })
            }
            aria-label="Add card"
          >
            <Plus className="size-3" />
          </Button>
        )}
      </div>

      <div className="group/column flex flex-1 flex-col overflow-hidden">
        <VirtualizedCardList cardIds={filteredCardIds} cardsById={cardsById} />
      </div>
    </div>
  );
}
