import {
  defaultAnimateLayoutChanges,
  useSortable,
  type AnimateLayoutChanges,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import type { CardData } from "~/types/board";
import type { CardDragData } from "~/types/dnd";
import { Card } from "./card";

interface SortableCardProps {
  card: CardData;
}

// Enable smooth animations when items are reordered, including after drag ends
const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

// Hook to detect if component was mounted during an active drag
function useMountStatus() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timeout);
  }, []);

  return isMounted;
}

export function SortableCard({ card }: SortableCardProps) {
  const { setNodeRef, listeners, attributes, isDragging, transform, transition } =
    useSortable({
      id: card.id,
      data: { type: "card", card } satisfies CardDragData,
      animateLayoutChanges,
    });

  const mounted = useMountStatus();
  const mountedWhileDragging = isDragging && !mounted;

  return (
    <Card
      ref={setNodeRef}
      card={card}
      dragging={isDragging}
      fadeIn={mountedWhileDragging}
      transform={transform}
      transition={transition}
      listeners={listeners}
      attributes={attributes}
    />
  );
}
