import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@repo/ui/lib/utils";
import { useSetAtom } from "jotai";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { dialogAtom } from "~/stores/kanban";
import type { CardData } from "~/types/board";
import type { CardDragData } from "~/types/dnd";

interface CardProps {
  card: CardData;
  onDelete?: (id: string) => void;
  isDragOverlay?: boolean;
}

const TOUCH_BUTTON_CLASS = "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0";

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
} as const;

export function Card({ card, onDelete, isDragOverlay }: CardProps) {
  const setDialog = useSetAtom(dialogAtom);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: { type: "card", card } satisfies CardDragData,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 200ms ease",
  };

  const tags = useMemo(
    () => (card.tags ? JSON.parse(card.tags) : []) as string[],
    [card.tags],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card text-card-foreground group relative rounded-lg border p-2 shadow-sm",
        "h-32 overflow-hidden",
        isDragging && !isDragOverlay && "opacity-0",
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle - visible on hover (desktop) or always (touch) */}
        <button
          type="button"
          className={cn(
            "text-muted-foreground hover:text-foreground mt-0.5 cursor-grab touch-none opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100",
            TOUCH_BUTTON_CLASS,
          )}
          aria-label="Drag card"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 sm:h-4 sm:w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 leading-tight font-medium">{card.title}</h4>

          {card.description && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {card.description}
            </p>
          )}

          <div className="mt-2 flex max-h-6 flex-wrap items-center gap-1.5 overflow-hidden">
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

        {/* Actions - visible on hover (desktop) or always (touch) */}
        <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={() =>
              setDialog({
                open: true,
                mode: "edit",
                cardId: card.id,
                columnId: card.columnId,
              })
            }
            className={cn(
              "text-muted-foreground hover:text-foreground hover:bg-accent rounded p-2.5 transition-colors sm:p-1",
              TOUCH_BUTTON_CLASS,
            )}
            aria-label="Edit card"
          >
            <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(card.id)}
              className={cn(
                "text-muted-foreground hover:text-destructive hover:bg-accent rounded p-2.5 transition-colors sm:p-1",
                TOUCH_BUTTON_CLASS,
              )}
              aria-label="Delete card"
            >
              <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
