import { cn } from "@repo/ui/lib/utils";
import { useDeleteCard } from "~/hooks/use-cards";
import { Card } from "./card";

interface CardData {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  tags: string | null;
  position: number;
  columnId: string;
}

interface GroupedColumnProps {
  group: {
    id: string;
    name: string;
    cards: CardData[];
  };
}

const priorityColors: Record<string, string> = {
  "priority-high": "border-t-red-500",
  "priority-medium": "border-t-yellow-500",
  "priority-low": "border-t-green-500",
  "priority-none": "border-t-gray-400",
};

export function GroupedColumn({ group }: GroupedColumnProps) {
  const deleteCard = useDeleteCard();

  const handleDeleteCard = (cardId: string) => {
    deleteCard.mutate({ id: cardId });
  };

  const borderColor = group.id.startsWith("priority-")
    ? priorityColors[group.id] || ""
    : "border-t-blue-500";

  return (
    <div
      className={cn(
        "bg-muted/50 flex h-fit w-72 flex-shrink-0 flex-col rounded-lg border border-t-4",
        borderColor,
      )}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 p-3">
        <span className="flex-1 text-sm font-semibold">{group.name}</span>
        <span className="text-muted-foreground text-xs">{group.cards.length}</span>
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2 pt-0">
        {group.cards.map((card) => (
          <Card key={card.id} card={card} onDelete={handleDeleteCard} />
        ))}

        {group.cards.length === 0 && (
          <div className="text-muted-foreground py-4 text-center text-sm">
            No cards
          </div>
        )}
      </div>
    </div>
  );
}
