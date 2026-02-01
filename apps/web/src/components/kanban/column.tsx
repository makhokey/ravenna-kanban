import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@repo/ui/lib/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useDeleteCard } from "~/hooks/use-cards";
import { useDeleteColumn, useUpdateColumn } from "~/hooks/use-columns";
import { dialogAtom, filterAtom } from "~/stores/kanban";
import { Card } from "./card";

interface CardData {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  tags: string | null;
  position: number;
  columnId: string;
}

interface ColumnData {
  id: string;
  name: string;
  position: number;
  cards: CardData[];
}

interface ColumnProps {
  column: ColumnData;
}

export function Column({ column }: ColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(column.name);
  const [showMenu, setShowMenu] = useState(false);

  const setDialog = useSetAtom(dialogAtom);
  const filter = useAtomValue(filterAtom);

  const updateColumn = useUpdateColumn();
  const deleteColumn = useDeleteColumn();
  const deleteCard = useDeleteCard();

  // Filter cards based on current filter
  const filteredCards = column.cards.filter((card) => {
    if (filter.priority && card.priority !== filter.priority) return false;
    if (filter.tag) {
      const tags: string[] = card.tags ? JSON.parse(card.tags) : [];
      if (!tags.includes(filter.tag)) return false;
    }
    return true;
  });

  const cardIds = filteredCards.map((card) => card.id);

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

  const handleDeleteCard = (cardId: string) => {
    deleteCard.mutate({ id: cardId });
  };

  return (
    <div
      className={cn(
        "bg-muted/50 flex h-fit w-72 flex-shrink-0 flex-col rounded-lg border",
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

        <span className="text-muted-foreground text-xs">{filteredCards.length}</span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="text-muted-foreground hover:text-foreground hover:bg-accent min-h-[44px] min-w-[44px] rounded p-2.5 sm:min-h-0 sm:min-w-0 sm:p-1"
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
          {filteredCards.map((card) => (
            <Card key={card.id} card={card} onDelete={handleDeleteCard} />
          ))}
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
