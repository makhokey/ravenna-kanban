import { useSortable } from "@dnd-kit/sortable";
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
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@repo/ui/components/menu";
import { cn } from "@repo/ui/lib/utils";
import { useSetAtom } from "jotai";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { useUpdateCard } from "~/hooks/use-cards";
import { dialogAtom } from "~/stores/board";
import type { CardData } from "~/types/board";
import type { CardDragData } from "~/types/dnd";
import {
  getSelectedTags,
  safeParseJsonTags,
  type PriorityValue,
  type StatusValue,
} from "~/components/shared/card-schema";
import { PrioritySelect } from "~/components/shared/priority-select";
import { StatusSelect } from "~/components/shared/status-select";
import { TagSelect } from "~/components/shared/tag-select";

interface CardProps {
  card: CardData;
  onDelete?: (id: string) => void;
  isDragOverlay?: boolean;
}

function CardComponent({ card, onDelete, isDragOverlay }: CardProps) {
  const setDialog = useSetAtom(dialogAtom);
  const updateCard = useUpdateCard();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", card } satisfies CardDragData,
  });

  const tags = useMemo(() => safeParseJsonTags(card.tags), [card.tags]);
  const selectedTags = useMemo(() => getSelectedTags(tags), [tags]);

  // Format date like "Mar 17"
  const formattedDate = useMemo(() => {
    const date = card.createdAt instanceof Date ? card.createdAt : new Date(card.createdAt);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }, [card.createdAt]);

  const handlePriorityChange = (priority: PriorityValue) => {
    updateCard.mutate({
      id: card.id,
      priority: priority === "no priority" ? null : priority,
    });
  };

  const handleTagsChange = (newTags: string[]) => {
    updateCard.mutate({
      id: card.id,
      tags: newTags.length > 0 ? newTags : null,
    });
  };

  const handleStatusChange = (status: StatusValue) => {
    updateCard.mutate({
      id: card.id,
      status,
    });
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-card text-card-foreground group relative flex h-auto min-h-32 flex-col gap-2 overflow-hidden rounded-lg border p-3",
        isDragging && !isDragOverlay && "opacity-0",
      )}
      {...attributes}
      {...listeners}
    >
      {/* Header: Priority + ID | Status + Menu */}
      <div
        className="flex items-center justify-between"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
         
          <span className="text-muted-foreground text-xs font-medium">
            {card.id.slice(0, 8).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <StatusSelect
            value={card.status as StatusValue}
            onChange={handleStatusChange}
            iconOnly
          />
          {/* <div className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            <Menu>
            <MenuTrigger
              render={
                <Button variant="ghost" size="icon-xs" aria-label="Card actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <MenuPopup align="start">
              <MenuItem
                onClick={() =>
                  setDialog({
                    open: true,
                    mode: "edit",
                    cardId: card.id,
                    columnId: card.columnId,
                  })
                }
              >
                <Pencil />
                Edit
              </MenuItem>
              {onDelete && (
                <MenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                  <Trash2 />
                  Delete
                </MenuItem>
              )}
            </MenuPopup>
          </Menu>
          </div> */}
        </div>
      </div>

      {/* Body: Title */}
      <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{card.title}</h3>

      {/* Tags row */}
      {selectedTags.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-1.5"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {selectedTags.map((tag) => (
            <Badge key={tag.value} variant="outline" className="capitalize rounded-full" size="sm">
              <span className={`size-2 rounded-full ${tag.color}`} />
              {tag.label}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer: Date | Tag selector */}
      <div
        className="mt-auto flex items-center justify-between"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span className="text-muted-foreground text-xs">{formattedDate}</span>
 <PrioritySelect
            value={(card.priority as PriorityValue) ?? "no priority"}
            onChange={handlePriorityChange}
            iconOnly
          />
      </div>

      {/* Delete confirmation dialog */}
      {onDelete && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete card</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{card.title}"? This action cannot be undone.
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

export const Card = memo(CardComponent, (prev, next) => {
  return (
    prev.card.id === next.card.id &&
    prev.card.updatedAt === next.card.updatedAt &&
    prev.card.title === next.card.title &&
    prev.card.description === next.card.description &&
    prev.card.priority === next.card.priority &&
    prev.card.status === next.card.status &&
    prev.card.tags === next.card.tags &&
    prev.card.columnId === next.card.columnId &&
    prev.isDragOverlay === next.isDragOverlay &&
    prev.onDelete === next.onDelete
  );
});
