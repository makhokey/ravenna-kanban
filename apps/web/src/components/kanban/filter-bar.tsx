import { cn } from "@repo/ui/lib/utils";
import { useAtom } from "jotai";
import { Filter, Layers, Plus, X } from "lucide-react";
import { useState } from "react";
import { useBoard } from "~/hooks/use-board";
import { useCreateColumn } from "~/hooks/use-columns";
import { filterAtom, groupByAtom } from "~/stores/kanban";

export function FilterBar() {
  const [filter, setFilter] = useAtom(filterAtom);
  const [groupBy, setGroupBy] = useAtom(groupByAtom);
  const { data: board } = useBoard();
  const createColumn = useCreateColumn();

  const [showColumnInput, setShowColumnInput] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  // Collect all unique tags from cards
  const allTags = new Set<string>();
  board?.columns.forEach((col) => {
    col.cards.forEach((card) => {
      if (card.tags) {
        const tags: string[] = JSON.parse(card.tags);
        tags.forEach((tag) => allTags.add(tag));
      }
    });
  });

  const handleAddColumn = () => {
    if (newColumnName.trim() && board) {
      createColumn.mutate(
        { boardId: board.id, name: newColumnName.trim() },
        {
          onSuccess: () => {
            setNewColumnName("");
            setShowColumnInput(false);
          },
        },
      );
    }
  };

  const hasFilters = filter.priority || filter.tag;

  return (
    <div className="border-b px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter icon */}
        <div className="text-muted-foreground flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
        </div>

        {/* Priority filter */}
        <select
          value={filter.priority ?? ""}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              priority: (e.target.value as "low" | "medium" | "high") || undefined,
            }))
          }
          className={cn(
            "border-input bg-background rounded-md border px-2 py-1 text-sm",
            filter.priority && "border-blue-500 ring-1 ring-blue-500",
          )}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        {/* Tag filter */}
        {allTags.size > 0 && (
          <select
            value={filter.tag ?? ""}
            onChange={(e) =>
              setFilter((prev) => ({
                ...prev,
                tag: e.target.value || undefined,
              }))
            }
            className={cn(
              "border-input bg-background rounded-md border px-2 py-1 text-sm",
              filter.tag && "border-blue-500 ring-1 ring-blue-500",
            )}
          >
            <option value="">All Tags</option>
            {Array.from(allTags).map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}

        {/* Clear filters */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => setFilter({})}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}

        {/* Separator */}
        <div className="bg-border h-5 w-px" />

        {/* Group by */}
        <div className="text-muted-foreground flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <span className="text-sm font-medium">Group by</span>
        </div>

        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as "column" | "priority" | "tag")}
          className={cn(
            "border-input bg-background rounded-md border px-2 py-1 text-sm",
            groupBy !== "column" && "border-blue-500 ring-1 ring-blue-500",
          )}
        >
          <option value="column">Column</option>
          <option value="priority">Priority</option>
          <option value="tag">Tag</option>
        </select>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Add Column */}
        {groupBy === "column" &&
          (showColumnInput ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Column name"
                className="border-input bg-background w-40 rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddColumn();
                  if (e.key === "Escape") setShowColumnInput(false);
                }}
              />
              <button
                type="button"
                onClick={handleAddColumn}
                disabled={createColumn.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1 text-sm font-medium"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowColumnInput(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowColumnInput(true)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
            >
              <Plus className="h-4 w-4" />
              Add Column
            </button>
          ))}
      </div>
    </div>
  );
}
