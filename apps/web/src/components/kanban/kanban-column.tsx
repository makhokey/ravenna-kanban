import { useDndContext, useDroppable } from "@dnd-kit/core";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { Plus } from "lucide-react";
import { memo, useMemo } from "react";
import { activeGroupKeyAtom, dialogAtom } from "~/atoms/board-atoms";
import { PriorityIcon } from "~/components/card-editor/priority-icon";
import { StatusIcon } from "~/components/card-editor/status-icon";
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from "~/lib/card-config";
import type { CardData, GroupBy, StatusValue } from "~/types/board-types";
import { CardList } from "./card-list";

interface KanbanColumnProps {
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

function KanbanColumnInner({ groupKey, groupBy, cardIds, cardsById }: KanbanColumnProps) {
  const setDialog = useSetAtom(dialogAtom);

  // Get display name for the column header
  const groupName = useMemo(() => getGroupName(groupKey, groupBy), [groupKey, groupBy]);

  // Only show add button in status view
  const showAddButton = groupBy === "status";

  return (
    <>
      {/* Column Header */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2 py-2">
          {groupBy === "status" ? (
            <StatusIcon status={groupKey as StatusValue} />
          ) : (
            <PriorityIcon priority={groupKey} />
          )}
          <p className="text-sm font-medium">{groupName}</p>
          <span className="text-muted-foreground text-xs">{cardIds.length}</span>
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
        <CardList cardIds={cardIds} cardsById={cardsById} />
      </div>
    </>
  );
}

// Memoize the inner content to prevent re-renders from dnd context changes
const MemoizedColumnContent = memo(KanbanColumnInner);

// Outer wrapper handles dnd-related state (droppable + highlight)
export function KanbanColumn({
  groupKey,
  groupBy,
  cardIds,
  cardsById,
}: KanbanColumnProps) {
  // Make the column a droppable target for cross-column moves
  const { setNodeRef: setDroppableRef } = useDroppable({
    id: groupKey,
    data: { type: "column", groupKey },
  });

  // Get current drag state - only highlight for cross-group drops
  const { over } = useDndContext();
  const activeGroupKey = useAtomValue(activeGroupKeyAtom);
  const overCardData = over?.data.current as
    | { card?: { status: string; priority: string | null } }
    | undefined;
  const isOverThisGroup =
    over !== null &&
    (over.id === groupKey ||
      (groupBy === "status"
        ? overCardData?.card?.status === groupKey
        : (overCardData?.card?.priority ?? "none") === groupKey));
  const isOver = isOverThisGroup && activeGroupKey !== groupKey;

  return (
    <div
      ref={setDroppableRef}
      className={cn(
        "flex h-full w-92 shrink-0 flex-col border-x border-transparent pt-2",
        isOver && "border-primary border-dashed duration-300 ease-in-out",
      )}
    >
      <MemoizedColumnContent
        groupKey={groupKey}
        groupBy={groupBy}
        cardIds={cardIds}
        cardsById={cardsById}
      />
    </div>
  );
}
