import { Button } from "@repo/ui/components/button";
import { useAtom } from "jotai";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useBoard } from "~/hooks/use-board";
import { useCreateCard, useUpdateCard } from "~/hooks/use-cards";
import { dialogAtom } from "~/stores/kanban";

export function CardDialog() {
  const [dialog, setDialog] = useAtom(dialogAtom);
  const { data: board } = useBoard();

  const createCard = useCreateCard();
  const updateCard = useUpdateCard();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "">("");
  const [tagsInput, setTagsInput] = useState("");

  // Find existing card data if editing
  const existingCard =
    dialog.mode === "edit" && dialog.cardId
      ? board?.columns
          .flatMap((col) => col.cards)
          .find((card) => card.id === dialog.cardId)
      : null;

  useEffect(() => {
    if (dialog.open) {
      if (existingCard) {
        setTitle(existingCard.title);
        setDescription(existingCard.description ?? "");
        setPriority((existingCard.priority as "low" | "medium" | "high") ?? "");
        const tags: string[] = existingCard.tags ? JSON.parse(existingCard.tags) : [];
        setTagsInput(tags.join(", "));
      } else {
        setTitle("");
        setDescription("");
        setPriority("");
        setTagsInput("");
      }
    }
  }, [dialog.open, existingCard]);

  if (!dialog.open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (dialog.mode === "create" && dialog.columnId) {
      createCard.mutate(
        {
          title,
          description: description || undefined,
          columnId: dialog.columnId,
          priority: priority || undefined,
          tags: tags.length > 0 ? tags : undefined,
        },
        {
          onSuccess: () => setDialog({ open: false, mode: "create" }),
        },
      );
    } else if (dialog.mode === "edit" && dialog.cardId) {
      updateCard.mutate(
        {
          id: dialog.cardId,
          title,
          description: description || undefined,
          priority: priority || null,
          tags: tags.length > 0 ? tags : undefined,
        },
        {
          onSuccess: () => setDialog({ open: false, mode: "create" }),
        },
      );
    }
  };

  const handleClose = () => {
    setDialog({ open: false, mode: "create" });
  };

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center duration-200">
      {/* Backdrop */}
      <div
        className="animate-in fade-in absolute inset-0 bg-black/50 duration-200"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="bg-background animate-in fade-in zoom-in-95 slide-in-from-bottom-4 relative z-10 w-full max-w-lg rounded-lg border p-6 shadow-lg duration-300">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {dialog.mode === "create" ? "Create Card" : "Edit Card"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
              placeholder="Card title"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="priority" className="mb-1 block text-sm font-medium">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
            >
              <option value="">None</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="mb-1 block text-sm font-medium">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="border-input bg-background focus:ring-ring w-full rounded-md border px-3 py-2 focus:ring-2 focus:outline-none"
              placeholder="Comma-separated tags (e.g., bug, feature)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCard.isPending || updateCard.isPending}>
              {createCard.isPending || updateCard.isPending
                ? "Saving..."
                : dialog.mode === "create"
                  ? "Create"
                  : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
