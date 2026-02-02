import { useSortable } from "@dnd-kit/sortable";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { useSetAtom } from "jotai";
import { Pencil, Trash2 } from "lucide-react";
import { memo, useMemo } from "react";
import { dialogAtom } from "~/stores/kanban";
import type { CardData } from "~/types/board";
import type { CardDragData } from "~/types/dnd";
import { TAG_OPTIONS } from "./card-schema";

interface CardProps {
  card: CardData;
  onDelete?: (id: string) => void;
  isDragOverlay?: boolean;
}

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
} as const;

const getTagColor = (tagValue: string) =>
  TAG_OPTIONS.find((opt) => opt.value === tagValue)?.color ?? "bg-gray-500";

function CardComponent({ card, onDelete, isDragOverlay }: CardProps) {
  const setDialog = useSetAtom(dialogAtom);

  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", card } satisfies CardDragData,
  });

  const tags = useMemo(
    () => (card.tags ? JSON.parse(card.tags) : []) as string[],
    [card.tags],
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-card text-card-foreground group relative h-32 overflow-hidden rounded p-2",
        isDragging && !isDragOverlay && "opacity-0",
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 leading-tight font-medium">{card.title}</h3>
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

            {tags.map((tag) => {
              const color = getTagColor(tag);
              return (
                <Badge key={tag} variant="outline" className="capitalize" size="sm">
                  <span className={`size-2 rounded-full ${color}`} />
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() =>
              setDialog({
                open: true,
                mode: "edit",
                cardId: card.id,
                columnId: card.columnId,
              })
            }
            aria-label="Edit card"
          >
            <Pencil />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(card.id)}
              aria-label="Delete card"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export const Card = memo(CardComponent, (prev, next) => {
  return (
    prev.card.id === next.card.id &&
    prev.card.updatedAt === next.card.updatedAt &&
    prev.card.title === next.card.title &&
    prev.card.description === next.card.description &&
    prev.card.priority === next.card.priority &&
    prev.card.tags === next.card.tags &&
    prev.card.columnId === next.card.columnId &&
    prev.isDragOverlay === next.isDragOverlay &&
    prev.onDelete === next.onDelete
  );
});
