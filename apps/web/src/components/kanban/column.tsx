import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@repo/ui/lib/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useDeleteCard } from "~/hooks/use-cards";
import { useDeleteColumn, useUpdateColumn } from "~/hooks/use-columns";
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

// Touch-friendly button sizing for mobile
const TOUCH_BUTTON_CLASS = "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0";

interface ColumnProps {
  column: ColumnData;
  cardIds: string[]; // Already sorted
  cardsById: Record<string, CardData>;
}

export function Column({ column, cardIds, cardsById }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);

  const setDialog = useSetAtom(dialogAtom);

  // Use granular selectors for drag state to minimize re-renders
  const activeId = useAtomValue(activeIdAtom);
  const targetColumnId = useAtomValue(targetColumnIdAtom);
  const insertIndex = useAtomValue(insertIndexAtom);

  // Visual feedback state
  const isDropTarget = activeId !== null && targetColumnId === column.id;
  const isDraggingFromThisColumn = cardIds.includes(activeId ?? "");

  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const deleteCard = useDeleteCard();

  const handleNameSubmit = () => {
    if (name.trim() && name !== column.name) {
      updateColumn.mutate({ id: column.id, name: name.trim() });
    } else {
      setName(column.name);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (
      confirm(`Delete "${column.name}" and all its cards? This action cannot be undone.`)
    ) {
      deleteColumn.mutate({ id: column.id });
    }
    setShowMenu(false);
  };

  const handleDeleteCard = useCallback(
    (cardId: string) => {
      deleteCard.mutate({ id: cardId });
    },
    [deleteCard],
  );

  return (
    <div
      className={cn(
        "bg-muted/50 flex h-fit w-72 flex-shrink-0 flex-col rounded-lg border transition-all duration-200",
        isDropTarget && "ring-primary/50 bg-primary/5 ring-2",
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 p-3">
        {isEditing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameSubmit();
              if (e.key === "Escape") {
                setName(column.name);
                setIsEditing(false);
              }
            }}
            className="bg-background flex-1 rounded border px-2 py-1 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex-1 text-left text-sm font-semibold"
          >
            {column.name}
          </button>
        )}

        <span className="text-muted-foreground text-xs">{cardIds.length}</span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "text-muted-foreground hover:text-foreground hover:bg-accent rounded p-2.5 sm:p-1",
              TOUCH_BUTTON_CLASS,
            )}
            aria-label="Column menu"
          >
            <MoreHorizontal className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="bg-popover text-popover-foreground absolute right-0 z-20 mt-1 w-40 rounded-md border py-1 shadow-lg">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="hover:bg-accent flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete column
                </button>
              </div>
            </>
          )}
        </div>
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
        <button
          type="button"
          onClick={() => setDialog({ open: true, mode: "create", columnId: column.id })}
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-dashed p-2 text-sm transition-colors"
        >
          <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
          Add card
        </button>
      </div>
    </div>
  );
}
