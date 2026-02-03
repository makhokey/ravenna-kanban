import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useAtomValue } from "jotai";
import { useMemo, useRef } from "react";
import { VList, type VListHandle } from "virtua";
import { activeCardIdAtom } from "~/atoms/board";
import type { CardData } from "~/types/board";
import { SortableCard } from "./sortable-card";

interface VirtualizedCardListProps {
  cardIds: string[];
  cardsById: Record<string, CardData>;
}

export function VirtualizedCardList({
  cardIds,
  cardsById,
}: VirtualizedCardListProps) {
  // Subscribe directly to activeCardId - only re-renders when this changes
  const activeId = useAtomValue(activeCardIdAtom);

  const listRef = useRef<VListHandle>(null);

  const keepMounted = useMemo(() => {
    if (!activeId) return undefined;
    const index = cardIds.indexOf(activeId);
    return index >= 0 ? [index] : undefined;
  }, [cardIds, activeId]);

  return (
    <div style={{ height: "100%" }} className="py-2">
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <VList ref={listRef} style={{ height: "100%" }} keepMounted={keepMounted}>
          {cardIds.map((id) => {
            const card = cardsById[id];
            if (!card) return null;

            return <SortableCard key={id} card={card} />;
          })}
        </VList>
      </SortableContext>
    </div>
  );
}
