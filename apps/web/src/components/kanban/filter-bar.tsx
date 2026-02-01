import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useBoard } from "~/hooks/use-board";
import { useCreateColumn } from "~/hooks/use-columns";

export function FilterBar() {
  const { data: board } = useBoard();
  const createColumn = useCreateColumn();

  const [showColumnInput, setShowColumnInput] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

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

  return (
    <div className="border-b px-4 py-3">
      <div className="flex flex-wrap items-center justify-end gap-3">
        {/* Add Column */}
        {showColumnInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Column name"
              className="border-input bg-background w-40 rounded-md border px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
        )}
      </div>
    </div>
  );
}
