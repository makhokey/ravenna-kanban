import { useSortable } from "@dnd-kit/sortable";
import { useState } from "react";
import { cardAnimateLayoutChanges } from "~/lib/dnd-utils";
import type { CardData } from "~/types/board-types";
import type { CardDragData } from "~/types/dnd-types";
import { Card } from "./card";

interface SortableCardProps {
  card: CardData;
}

export function SortableCard({ card }: SortableCardProps) {
  const { setNodeRef, listeners, attributes, isDragging, transform, transition } =
    useSortable({
      id: card.id,
      data: { type: "card", card } satisfies CardDragData,
      animateLayoutChanges: cardAnimateLayoutChanges,
    });
  const [mountedDuringDrag] = useState(() => isDragging);

  return (
    <Card
      ref={setNodeRef}
      card={card}
      dragging={isDragging}
      fadeIn={mountedDuringDrag}
      transform={transform}
      transition={transition}
      listeners={listeners}
      attributes={attributes}
    />
  );
}
