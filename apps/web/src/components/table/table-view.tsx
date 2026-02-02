import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { cn } from "@repo/ui/lib/utils";
import { useAtomValue, useSetAtom } from "jotai";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import {
  getPriorityOption,
  safeParseJsonTags,
  TAG_OPTIONS,
} from "~/components/shared/card-schema";
import { useBoard } from "~/hooks/use-board";
import { useDeleteCard } from "~/hooks/use-cards";
import { useFilteredCards } from "~/hooks/use-filtered-cards";
import { dialogAtom, priorityFiltersAtom, tagFiltersAtom } from "~/stores/board";

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
} as const;

const getTagColor = (tagValue: string) =>
  TAG_OPTIONS.find((opt) => opt.value === tagValue)?.color ?? "bg-gray-500";

export function TableView() {
  const { data: board } = useBoard();
  const setDialog = useSetAtom(dialogAtom);
  const deleteCard = useDeleteCard();
  const priorityFilters = useAtomValue(priorityFiltersAtom);
  const tagFilters = useAtomValue(tagFiltersAtom);

  // Flatten all cards from all columns
  const allCards = useMemo(() => {
    if (!board) return [];
    return board.columnIds.flatMap((colId) =>
      (board.cardIdsByColumn[colId] ?? []).map((cardId) => ({
        ...board.cardsById[cardId]!,
        columnName: board.columnsById[colId]!.name,
      })),
    );
  }, [board]);

  // Apply filters
  const filteredCards = useFilteredCards(allCards, priorityFilters, tagFilters);

  if (!board) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          No board found. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead className="w-[300px]">Title</TableHead>
            <TableHead>Column</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCards.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground text-center">
                {allCards.length === 0 ? "No cards yet" : "No cards match filters"}
              </TableCell>
            </TableRow>
          ) : (
            filteredCards.map((card) => {
              const tags = safeParseJsonTags(card.tags);
              return (
                <TableRow key={card.id}>
                  <TableCell>
                    <span className="text-muted-foreground text-xs font-medium">
                      {card.displayId ?? card.id.slice(0, 8).toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{card.title}</p>
                      {card.description && (
                        <p className="text-muted-foreground line-clamp-1 text-sm">
                          {card.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{card.columnName}</Badge>
                  </TableCell>
                  <TableCell>
                    {card.priority &&
                      (() => {
                        const priorityOption = getPriorityOption(card.priority);
                        const PriorityIcon = priorityOption.icon;
                        return (
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full p-1",
                              priorityColors[
                                card.priority as keyof typeof priorityColors
                              ],
                            )}
                          >
                            <PriorityIcon className="size-3" />
                          </span>
                        );
                      })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          size="sm"
                          className="capitalize"
                        >
                          <span className={cn("size-2 rounded-full", getTagColor(tag))} />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
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
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => deleteCard.mutate({ id: card.id })}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
