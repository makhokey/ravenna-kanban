import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useAtom, useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { useBoard } from "~/hooks/use-board";
import { useMoveCard } from "~/hooks/use-cards";
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
  position: number;
  columnId: string;
}

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
        name: priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "No Priority",
        cards: filteredCards
          .filter((card) => card.priority === priority)
          .sort((a, b) => a.position - b.position),
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
        cards: cards.sort((a, b) => a.position - b.position),
      }));
    }

    return null;
  }, [groupBy, filteredCards]);

  if (!board) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No board found. Create one to get started.</p>
      </div>
    );
  }

  const columnIds = board.columns.map((col) => col.id);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;

    if (type === "card") {
      setActiveCard(active.data.current?.card);
      setDragState({ activeId: active.id as string, type: "card" });
    } else if (type === "column") {
      setDragState({ activeId: active.id as string, type: "column" });
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

    if (!over) return;

    const activeType = active.data.current?.type;

    if (activeType === "card" && groupBy === "column") {
      const activeCard = active.data.current?.card as CardData;
      const overType = over.data.current?.type;

      let targetColumnId: string;
      let targetPosition: number;

      if (overType === "column") {
        // Dropped on empty column
        targetColumnId = over.id as string;
        const targetColumn = board.columns.find((col) => col.id === targetColumnId);
        targetPosition = targetColumn?.cards.length ?? 0;
      } else if (overType === "card") {
        // Dropped on another card
        const overCard = over.data.current?.card as CardData;
        targetColumnId = overCard.columnId;
        targetPosition = overCard.position;
      } else {
        return;
      }

      // Only update if something changed
      if (activeCard.columnId !== targetColumnId || activeCard.position !== targetPosition) {
        moveCard.mutate({
          cardId: activeCard.id,
          columnId: targetColumnId,
          position: targetPosition,
        });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto p-4">
        {groupBy === "column" ? (
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            {board.columns.map((column) => (
              <Column key={column.id} column={column} />
            ))}
          </SortableContext>
        ) : (
          groupedColumns?.map((group) => (
            <GroupedColumn key={group.id} group={group} />
          ))
        )}
      </div>

      <DragOverlay>
        {dragState.type === "card" && activeCard && (
          <div className="rotate-3 opacity-90">
            <Card card={activeCard} onDelete={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
