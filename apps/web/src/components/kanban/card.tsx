import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import type { Transform } from "@dnd-kit/utilities";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { useAtom } from "jotai";
import { type CSSProperties, memo, type Ref, useMemo, useState } from "react";
import {
  getSelectedTags,
  safeParseJsonTags,
  type PriorityValue,
  type StatusValue,
} from "~/components/shared/card-schema";
import { PrioritySelect } from "~/components/shared/priority-select";
import { StatusSelect } from "~/components/shared/status-select";
import { useUpdateCard } from "~/hooks/use-cards";
import { panelAtom } from "~/stores/board";
import type { CardData } from "~/types/board";

export interface CardProps {
  card: CardData;
  onDelete?: (id: string) => void;
  // Drag state props (following dnd-kit Item pattern)
  dragOverlay?: boolean;
  dragging?: boolean;
  fadeIn?: boolean;
  transform?: Transform | null;
  transition?: string | null;
  listeners?: DraggableSyntheticListeners;
  attributes?: React.HTMLAttributes<HTMLDivElement>;
  ref?: Ref<HTMLDivElement>;
}

function CardComponent({
  card,
  onDelete,
  dragOverlay,
  dragging,
  fadeIn,
  transform,
  transition,
  listeners,
  attributes,
  ref,
}: CardProps) {
  const [panel, setPanel] = useAtom(panelAtom);
  const updateCard = useUpdateCard();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isSelected = panel.open && panel.cardId === card.id;

  const tags = useMemo(() => safeParseJsonTags(card.tags), [card.tags]);
  const selectedTags = useMemo(() => getSelectedTags(tags), [tags]);

  // Format date like "Mar 17"
  const formattedDate = useMemo(() => {
    const date =
      card.createdAt instanceof Date ? card.createdAt : new Date(card.createdAt);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [card.createdAt]);

  const handlePriorityChange = (priority: PriorityValue) => {
    updateCard.mutate({
      id: card.id,
      priority: priority === "no priority" ? null : priority,
    });
  };

  const handleStatusChange = (status: StatusValue) => {
    updateCard.mutate({
      id: card.id,
      status,
    });
  };

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0) scaleX(${transform.scaleX ?? 1}) scaleY(${transform.scaleY ?? 1})`
      : undefined,
    transition: transition ?? undefined,
  };

  return (
    <div
      ref={ref}
      className={cn(
        "bg-card text-card-foreground group relative mb-2 flex h-auto min-h-32 cursor-grab flex-col gap-2 overflow-hidden rounded-lg border p-3 select-none active:cursor-grabbing",
        // Hide original when dragging (not the overlay)
        dragging && !dragOverlay && "opacity-0",
        // Drag overlay styling
        dragOverlay && "cursor-grabbing shadow-xl shadow-black/25",
        // Fade-in animation for items mounted during drag
        fadeIn && "animate-fadeIn",
        isSelected && "border-primary",
      )}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={() => {
        if (isSelected) {
          setPanel({ open: false, mode: "create" });
        } else {
          setPanel({
            open: true,
            mode: "edit",
            cardId: card.id,
            columnId: card.columnId,
          });
        }
      }}
    >
      {/* Header: Card ID | Status */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs font-medium">
          {card.displayId ?? card.id.slice(0, 8).toUpperCase()}
        </span>
        <div
          className="flex items-center gap-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <StatusSelect
            value={card.status as StatusValue}
            onChange={handleStatusChange}
            iconOnly
          />
        </div>
      </div>

      {/* Body: Title */}
      <h3 className="line-clamp-2 text-sm leading-tight font-semibold">{card.title}</h3>

      {/* Tags row */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.value}
              variant="outline"
              className="rounded-full capitalize"
              size="sm"
            >
              <span className={`size-2 rounded-full ${tag.color}`} />
              {tag.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer: Date | Priority */}
      <div className="mt-auto flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{formattedDate}</span>
        <div onPointerDown={(e) => e.stopPropagation()}>
          <PrioritySelect
            value={(card.priority as PriorityValue) ?? "no priority"}
            onChange={handlePriorityChange}
            iconOnly
          />
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {onDelete && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete card</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{card.title}"? This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline">Cancel</Button>} />
              <AlertDialogClose
                render={
                  <Button variant="destructive" onClick={() => onDelete(card.id)}>
                    Delete
                  </Button>
                }
              />
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      )}
    </div>
  );
}

export const Card = memo(CardComponent);
