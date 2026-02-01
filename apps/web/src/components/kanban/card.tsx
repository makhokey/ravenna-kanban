import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@repo/ui/lib/utils";
import { useSetAtom } from "jotai";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { dialogAtom } from "~/stores/kanban";

interface CardData {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  tags: string | null;
  position: number;
  columnId: string;
}

interface CardProps {
  card: CardData;
  onDelete: (id: string) => void;
}

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
} as const;

export function Card({ card, onDelete }: CardProps) {
  const setDialog = useSetAtom(dialogAtom);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { type: "card", card },
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const tags: string[] = card.tags ? JSON.parse(card.tags) : [];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card text-card-foreground group relative rounded-lg border p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground mt-0.5 cursor-grab touch-none opacity-0 transition-opacity group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h4 className="font-medium leading-tight">{card.title}</h4>

          {card.description && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {card.description}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {card.priority && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  priorityColors[card.priority as keyof typeof priorityColors],
                )}
              >
                {card.priority}
              </span>
            )}

            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() =>
              setDialog({ open: true, mode: "edit", cardId: card.id, columnId: card.columnId })
            }
            className="text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(card.id)}
            className="text-muted-foreground hover:text-destructive rounded p-1 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
