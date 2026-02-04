import type { DraggableSyntheticListeners } from "@dnd-kit/core";
import type { Transform } from "@dnd-kit/utilities";
import { Badge } from "@repo/ui/components/badge";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/utils";
import { useAtom } from "jotai";
import { type CSSProperties, memo, type Ref, useMemo } from "react";
import {
  getSelectedTags,
  safeParseJsonTags,
  type PriorityValue,
  type StatusValue,
} from "~/components/shared/card-schema";
import { PrioritySelect } from "~/components/shared/priority-select";
import { StatusSelect } from "~/components/shared/status-select";
import { useUpdateCard } from "~/hooks/use-cards";
import { panelAtom } from "~/atoms/board";
import type { CardData } from "~/types/board";

export interface CardProps {
  card: CardData;
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
        "bg-card text-card-foreground group relative mb-2 flex h-32 mx-2.5 cursor-pointer flex-col gap-2 overflow-hidden rounded-lg border p-3 select-none",
        // Hide original when dragging (not the overlay)
        dragging && !dragOverlay && "opacity-0",
        // Drag overlay styling
        dragOverlay && "cursor-grabbing shadow-xl",
        // Fade-in animation for items mounted during drag
        fadeIn && "animate-fadeIn",
        isSelected && "border-primary border-dashed",
      )}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (isSelected) {
          setPanel({ open: false, mode: "create" });
        } else {
          setPanel({
            open: true,
            mode: "edit",
            cardId: card.id,
            status: (card.status as "backlog" | "todo" | "in_progress" | "review" | "done") ?? "backlog",
          });
        }
      }}
    >
      {/* Header */}
      <header className="flex items-center justify-between">
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
      </header>

      <div className="flex flex-1 flex-col gap-1.5">
        <h3 className="line-clamp-2 text-sm leading-tight font-semibold">
          {card.title}
        </h3>
        <div className="flex h-5 items-center gap-1.5">
          {selectedTags.slice(0, 2).map((tag) => (
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
          {selectedTags.length > 2 && (
            <Tooltip>
              <TooltipTrigger
                className="cursor-default"
                render={
                  <Badge variant="outline" className="rounded-full" size="sm">
                    +{selectedTags.length - 2}
                  </Badge>
                }
              />
              <TooltipPopup side="top">
                {selectedTags.map((t) => t.label).join(", ")}
              </TooltipPopup>
            </Tooltip>
          )}
        </div>
      </div>

      <footer className="mt-auto flex items-center justify-between">
        <span className="text-muted-foreground text-xs">{formattedDate}</span>
        <div
          className="flex items-center gap-1"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <PrioritySelect
            value={(card.priority as PriorityValue) ?? "no priority"}
            onChange={handlePriorityChange}
            iconOnly
          />
        </div>
      </footer>
    </div>
  );
}

export const Card = memo(CardComponent);
