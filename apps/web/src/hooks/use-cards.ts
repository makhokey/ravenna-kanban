import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCard, deleteCard, moveCard, updateCard } from "~/server/cards";
import { boardKeys } from "./query-keys";
import { BoardData, DEFAULT_BOARD_ID } from "./use-board";

type CreateCardInput = {
  title: string;
  description?: string;
  columnId: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
};

type UpdateCardInput = {
  id: string;
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high" | null;
  tags?: string[];
};

type MoveCardInput = {
  cardId: string;
  columnId: string;
  position: number;
};

type DeleteCardInput = {
  id: string;
};

// Helper to update card position in board data (for optimistic updates)
function updateCardInBoard(
  board: BoardData,
  cardId: string,
  targetColumnId: string,
  targetPosition: number,
): BoardData {
  if (!board) return board;

  const columns = board.columns.map((col) => ({
    ...col,
    cards: [...col.cards],
  }));

  // Find the card and its source column
  let sourceColumnIdx = -1;
  let cardIdx = -1;
  let movedCard: (typeof columns)[0]["cards"][0] | null = null;

  for (let i = 0; i < columns.length; i++) {
    const idx = columns[i]!.cards.findIndex((c) => c.id === cardId);
    if (idx !== -1) {
      sourceColumnIdx = i;
      cardIdx = idx;
      movedCard = columns[i]!.cards[idx]!;
      break;
    }
  }

  if (!movedCard || sourceColumnIdx === -1) return board;

  const targetColumnIdx = columns.findIndex((c) => c.id === targetColumnId);
  if (targetColumnIdx === -1) return board;

  // Remove from source
  columns[sourceColumnIdx]!.cards.splice(cardIdx, 1);

  // Update positions in source column
  columns[sourceColumnIdx]!.cards.forEach((card, i) => {
    card.position = i;
  });

  // Insert at target position
  const updatedCard = {
    ...movedCard,
    columnId: targetColumnId,
    position: targetPosition,
  };
  columns[targetColumnIdx]!.cards.splice(targetPosition, 0, updatedCard);

  // Update positions in target column
  columns[targetColumnIdx]!.cards.forEach((card, i) => {
    card.position = i;
  });

  return { ...board, columns };
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(DEFAULT_BOARD_ID);

  return useMutation({
    mutationFn: (input: CreateCardInput) => createCard({ data: input }),
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previous = queryClient.getQueryData<BoardData>(queryKey);

      // Optimistically add the card
      queryClient.setQueryData<BoardData>(queryKey, (old) => {
        if (!old) return old;

        const tempId = `temp-${Date.now()}`;
        const columns = old.columns.map((col) => {
          if (col.id !== input.columnId) return col;

          const newCard = {
            id: tempId,
            title: input.title,
            description: input.description ?? null,
            columnId: input.columnId,
            priority: input.priority ?? null,
            tags: input.tags ? JSON.stringify(input.tags) : null,
            position: col.cards.length,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          return {
            ...col,
            cards: [...col.cards, newCard],
          };
        });

        return { ...old, columns };
      });

      return { previous };
    },
    onError: (_err, _input, ctx) => {
      // Rollback on error
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error("Failed to create card");
    },
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(DEFAULT_BOARD_ID);

  return useMutation({
    mutationFn: (input: UpdateCardInput) => updateCard({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<BoardData>(queryKey);

      // Optimistically update the card
      queryClient.setQueryData<BoardData>(queryKey, (old) => {
        if (!old) return old;

        const columns = old.columns.map((col) => ({
          ...col,
          cards: col.cards.map((card) => {
            if (card.id !== input.id) return card;

            return {
              ...card,
              title: input.title ?? card.title,
              description:
                input.description !== undefined ? input.description : card.description,
              priority: input.priority !== undefined ? input.priority : card.priority,
              tags: input.tags !== undefined ? JSON.stringify(input.tags) : card.tags,
              updatedAt: new Date(),
            };
          }),
        }));

        return { ...old, columns };
      });

      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error("Failed to update card");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useMoveCard() {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(DEFAULT_BOARD_ID);

  return useMutation({
    mutationFn: (input: MoveCardInput) => moveCard({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<BoardData>(queryKey);

      // Optimistically move the card
      queryClient.setQueryData<BoardData>(queryKey, (old) => {
        if (!old) return old;
        return updateCardInBoard(old, input.cardId, input.columnId, input.position);
      });

      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error("Failed to move card");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(DEFAULT_BOARD_ID);

  return useMutation({
    mutationFn: (input: DeleteCardInput) => deleteCard({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<BoardData>(queryKey);

      // Optimistically remove the card
      queryClient.setQueryData<BoardData>(queryKey, (old) => {
        if (!old) return old;

        const columns = old.columns.map((col) => ({
          ...col,
          cards: col.cards
            .filter((card) => card.id !== input.id)
            .map((card, idx) => ({ ...card, position: idx })),
        }));

        return { ...old, columns };
      });

      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error("Failed to delete card");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
