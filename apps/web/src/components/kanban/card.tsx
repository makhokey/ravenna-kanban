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
import { dialogAtom } from "~/stores/board";
import type { CardData } from "~/types/board";
import type { CardDragData } from "~/types/dnd";
import { getPriorityOption, TAG_OPTIONS } from "~/components/shared/card-schema";

interface CardProps {
  card: CardData;
  onDelete?: (id: string) => void;
  isDragOverlay?: boolean;
}

const getTagColor = (tagValue: string) =>
  TAG_OPTIONS.find((opt) => opt.value === tagValue)?.color ?? "bg-gray-500";

function CardComponent({ card, onDelete, isDragOverlay }: CardProps) {
  const setDialog = useSetAtom(dialogAtom);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
          <h3 className="line-clamp-2 text-sm font-medium leading-tight">{card.title}</h3>
          {card.description && (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {card.description}
            </p>
          )}

          <div className="mt-2 flex max-h-6 flex-wrap items-center gap-1.5 overflow-hidden">
            {card.priority && (() => {
              const priorityOption = getPriorityOption(card.priority);
              const PriorityIcon = priorityOption.icon;
              return (
                <span
                  className="flex items-center rounded border p-0.5"
                >
                  <PriorityIcon className="size-4" />
                </span>
              );
            })()}

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

        <div className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Menu>
            <MenuTrigger
              render={
                <Button variant="ghost" size="icon-xs" aria-label="Card actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              }
            />
            <MenuPopup align="end">
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
