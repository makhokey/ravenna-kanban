import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors,
  type DropAnimation,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { generateKeyBetween } from "fractional-indexing";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { useBoard } from "~/hooks/use-board";
import { useMoveCard } from "~/hooks/use-cards";
import { comparePosition } from "~/lib/position";
import { dragStateAtom, filterAtom, groupByAtom } from "~/stores/kanban";
import { Card } from "./card";
import { Column } from "./column";
import { GroupedColumn } from "./grouped-column";

interface CardData {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  tags: string | null;
  position: string; // Fractional index
  columnId: string;
}

// Drop animation config for smooth card placement
const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

export function Board() {
  const { data: board } = useBoard();
  const [dragState, setDragState] = useAtom(dragStateAtom);
  const groupBy = useAtomValue(groupByAtom);
  const filter = useAtomValue(filterAtom);
  const moveCard = useMoveCard();

  const [activeCard, setActiveCard] = useState<CardData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Get all cards from all columns
  const allCards = useMemo(() => {
    if (!board) return [];
    return board.columns.flatMap((col) => col.cards);
  }, [board]);

  // Filter cards based on current filter
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      if (filter.priority && card.priority !== filter.priority) return false;
      if (filter.tag) {
        const tags: string[] = card.tags ? JSON.parse(card.tags) : [];
        if (!tags.includes(filter.tag)) return false;
      }
      return true;
    });
  }, [allCards, filter]);

  // Create grouped columns when grouping by priority or tag
  const groupedColumns = useMemo(() => {
    if (groupBy === "column") return null;

    if (groupBy === "priority") {
      const priorities = ["high", "medium", "low", null];
      return priorities.map((priority) => ({
        id: `priority-${priority ?? "none"}`,
        name: priority
          ? priority.charAt(0).toUpperCase() + priority.slice(1)
          : "No Priority",
        cards: filteredCards
          .filter((card) => card.priority === priority)
          .sort((a, b) => comparePosition(a.position, b.position)),
      }));
    }

    if (groupBy === "tag") {
      const tagMap = new Map<string, CardData[]>();
      tagMap.set("untagged", []);

      filteredCards.forEach((card) => {
        const tags: string[] = card.tags ? JSON.parse(card.tags) : [];
        if (tags.length === 0) {
          tagMap.get("untagged")!.push(card);
        } else {
          tags.forEach((tag) => {
            if (!tagMap.has(tag)) {
              tagMap.set(tag, []);
            }
            tagMap.get(tag)!.push(card);
          });
        }
      });

      return Array.from(tagMap.entries()).map(([tag, cards]) => ({
        id: `tag-${tag}`,
        name: tag === "untagged" ? "Untagged" : tag,
        cards: cards.sort((a, b) => comparePosition(a.position, b.position)),
      }));
    }

    return null;
  }, [groupBy, filteredCards]);

  if (!board) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          No board found. Create one to get started.
        </p>
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === "card") {
      setActiveCard(active.data.current?.card);
      setDragState({ activeId: active.id as string, type: "card" });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType !== "card") return;

    // Find source and destination columns
    const activeCard = active.data.current?.card as CardData;
    let overColumnId: string;

    if (overType === "column") {
      overColumnId = over.id as string;
    } else if (overType === "card") {
      overColumnId = (over.data.current?.card as CardData).columnId;
    } else {
      return;
    }

    if (activeCard.columnId !== overColumnId) {
      // Update the active card's column (optimistic update will be handled by mutation)
      setActiveCard((prev) => (prev ? { ...prev, columnId: overColumnId } : null));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setDragState({ activeId: null, type: null });
    setActiveCard(null);

    if (!over || groupBy !== "column") return;
    if (active.data.current?.type !== "card") return;

    const activeCard = active.data.current.card as CardData;
    const overType = over.data.current?.type;

    // Determine target column
    const targetColumnId =
      overType === "column"
        ? (over.id as string)
        : (over.data.current?.card as CardData).columnId;

    // Get sorted cards in target column (excluding the dragged card)
    const targetColumn = board!.columns.find((col) => col.id === targetColumnId);
    const sortedCards = [...(targetColumn?.cards ?? [])]
      .filter((c) => c.id !== activeCard.id)
      .sort((a, b) => comparePosition(a.position, b.position));

    // Find insertion index
    let insertIndex: number;
    if (overType === "column") {
      insertIndex = sortedCards.length; // Append at end
    } else {
      const overCard = over.data.current?.card as CardData;
      const overIndex = sortedCards.findIndex((c) => c.id === overCard.id);

      if (overIndex === -1) {
        insertIndex = sortedCards.length;
      } else {
        // Determine insert position based on drag direction
        const isSameColumn = activeCard.columnId === targetColumnId;
        const activeIndex = isSameColumn
          ? sortedCards.findIndex((c) => c.id === activeCard.id)
          : -1;

        // If dragging down (or cross-column), insert after over card
        // If dragging up, insert before over card
        const isDraggingDown = !isSameColumn || activeIndex < overIndex;
        insertIndex = isDraggingDown ? overIndex + 1 : overIndex;
      }
    }

    // Calculate fractional position between neighbors
    const prevCard = sortedCards[insertIndex - 1];
    const nextCard = sortedCards[insertIndex];
    const newPosition = generateKeyBetween(
      prevCard?.position ?? null,
      nextCard?.position ?? null,
    );

    // Only mutate if something changed
    if (activeCard.columnId !== targetColumnId || activeCard.position !== newPosition) {
      moveCard.mutate({
        cardId: activeCard.id,
        columnId: targetColumnId,
        position: newPosition,
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto overscroll-x-contain p-4 [-webkit-overflow-scrolling:touch]">
        {groupBy === "column"
          ? board.columns.map((column) => <Column key={column.id} column={column} />)
          : groupedColumns?.map((group) => (
              <GroupedColumn key={group.id} group={group} />
            ))}
      </div>

      <DragOverlay
        dropAnimation={dropAnimationConfig}
        modifiers={[restrictToWindowEdges]}
      >
        {dragState.type === "card" && activeCard && (
          <Card card={activeCard} onDelete={() => {}} isDragOverlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}
