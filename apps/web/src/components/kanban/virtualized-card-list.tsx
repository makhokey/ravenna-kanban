import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef } from "react";
import { VList, type VListHandle } from "virtua";
import type { CardData } from "~/types/board";
import { Card } from "./card";

interface VirtualizedCardListProps {
  cardIds: string[];
  cardsById: Record<string, CardData>;
  onDelete: (cardId: string) => void;
  activeId: string | null;
}

const SCROLL_THRESHOLD = 80; // px from edge to trigger scroll
const SCROLL_SPEED = 10; // px per tick

export function VirtualizedCardList({
  cardIds,
  cardsById,
  onDelete,
  activeId,
}: VirtualizedCardListProps) {
  const listRef = useRef<VListHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep the active (dragging) card mounted to prevent dnd-kit losing track during scroll
  const keepMounted = useMemo(() => {
    if (!activeId) return undefined;
    const index = cardIds.indexOf(activeId);
    return index >= 0 ? [index] : undefined;
  }, [cardIds, activeId]);

  // Custom edge-detection scroll during drag
  useEffect(() => {
    if (!activeId) return;

    let scrollDirection = 0; // -1 up, 0 none, 1 down
    let scrollSpeed = 0;
    let intervalId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const y = e.clientY - rect.top;

      if (y < SCROLL_THRESHOLD && y >= 0) {
        // Near top - scroll up
        const intensity = 1 - y / SCROLL_THRESHOLD;
        scrollDirection = -1;
        scrollSpeed = SCROLL_SPEED * intensity;
      } else if (y > rect.height - SCROLL_THRESHOLD && y <= rect.height) {
        // Near bottom - scroll down
        const intensity = 1 - (rect.height - y) / SCROLL_THRESHOLD;
        scrollDirection = 1;
        scrollSpeed = SCROLL_SPEED * intensity;
      } else {
        scrollDirection = 0;
        scrollSpeed = 0;
      }
    };

    // Continuous scroll while in edge zone
    intervalId = window.setInterval(() => {
      if (scrollDirection !== 0 && listRef.current) {
        listRef.current.scrollBy(scrollDirection * scrollSpeed);
      }
    }, 16); // ~60fps

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [activeId]);

  return (
    <div ref={containerRef} style={{ height: "100%" }}>
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <VList ref={listRef} style={{ height: "100%" }} keepMounted={keepMounted}>
          {cardIds.map((id) => {
            const card = cardsById[id];
            if (!card) return null;

            return <Card key={id} card={card} onDelete={onDelete} />;
          })}
        </VList>
      </SortableContext>
    </div>
  );
}
