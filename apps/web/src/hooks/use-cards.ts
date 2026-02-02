import { toastManager } from "@repo/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateKeyBetween } from "fractional-indexing";
import { comparePosition } from "~/lib/position";
import { createCard, deleteCard, moveCard, updateCard } from "~/server/cards";
import { boardKeys } from "./query-keys";
import { BoardData, DEFAULT_BOARD_ID } from "./use-board";

type CreateCardInput = {
  title: string;
  description?: string;
  columnId: string;
  // null = no priority, undefined = not provided
  priority?: "low" | "medium" | "high" | null;
  // null = no status, undefined = not provided
  status?: "backlog" | "todo" | "in_progress" | "review" | "done" | null;
  // null = no tags, undefined = not provided
  tags?: string[] | null;
};

type UpdateCardInput = {
  id: string;
  title?: string;
  description?: string;
  // null = clear priority, undefined = unchanged
  priority?: "low" | "medium" | "high" | null;
  // null = clear status, undefined = unchanged
  status?: "backlog" | "todo" | "in_progress" | "review" | "done" | null;
  // null = clear tags, undefined = unchanged
  tags?: string[] | null;
};

type MoveCardInput = {
  cardId: string;
  columnId: string;
  position: string; // Fractional index
};

type DeleteCardInput = {
  id: string;
};

// Helper: Update card position in normalized board (for optimistic updates)
function moveCardInBoard(
  board: BoardData,
  cardId: string,
  targetColumnId: string,
  newPosition: string,
): BoardData {
  const card = board.cardsById[cardId];
  if (!card) return board;

  const sourceColumnId = card.columnId;

  // Update card
  const updatedCard = { ...card, columnId: targetColumnId, position: newPosition };

  // Update lookup tables
  const cardsById = { ...board.cardsById, [cardId]: updatedCard };

  // Update source column's card IDs (remove)
  const sourceCardIds = board.cardIdsByColumn[sourceColumnId]!.filter(
    (id) => id !== cardId,
  );

  // Update target column's card IDs (insert sorted)
  const targetCardIds =
    sourceColumnId === targetColumnId
      ? sourceCardIds
      : [...board.cardIdsByColumn[targetColumnId]!];

  // Insert at correct position (find insertion point)
  const insertIdx = targetCardIds.findIndex(
    (id) => comparePosition(cardsById[id]!.position, newPosition) > 0,
  );
  targetCardIds.splice(insertIdx === -1 ? targetCardIds.length : insertIdx, 0, cardId);

  const cardIdsByColumn = {
    ...board.cardIdsByColumn,
    [sourceColumnId]: sourceCardIds,
    [targetColumnId]: targetCardIds,
  };

  return { ...board, cardsById, cardIdsByColumn };
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
        const columnCardIds = old.cardIdsByColumn[input.columnId] ?? [];

        // Get last card's position for fractional indexing
        const lastCardId = columnCardIds[columnCardIds.length - 1];
        const lastPosition = lastCardId
          ? (old.cardsById[lastCardId]?.position ?? null)
          : null;
        const newPosition = generateKeyBetween(lastPosition, null);

        const newCard = {
          id: tempId,
          title: input.title,
          description: input.description ?? null,
          columnId: input.columnId,
          // null or undefined both mean no priority
          priority: input.priority ?? null,
          // null or undefined both mean no status
          status: input.status ?? null,
          // null or undefined both mean no tags, empty array also means no tags
          tags: input.tags && input.tags.length > 0 ? JSON.stringify(input.tags) : null,
          position: newPosition,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };

        return {
          ...old,
          cardsById: { ...old.cardsById, [tempId]: newCard },
          cardIdsByColumn: {
            ...old.cardIdsByColumn,
            [input.columnId]: [...columnCardIds, tempId],
          },
        };
      });

      return { previous };
    },
    onSuccess: () => {
      toastManager.add({ type: "success", title: "Card created" });
    },
    onError: (_err, _input, ctx) => {
      // Rollback on error
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toastManager.add({ type: "error", title: "Failed to create card" });
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

        const card = old.cardsById[input.id];
        if (!card) return old;

        const updatedCard = {
          ...card,
          title: input.title ?? card.title,
          description:
            input.description !== undefined ? input.description : card.description,
          // null = clear, undefined = unchanged
          priority: input.priority !== undefined ? input.priority : card.priority,
          // null = clear, undefined = unchanged
          status: input.status !== undefined ? input.status : card.status,
          // null = clear, undefined = unchanged
          tags:
            input.tags !== undefined
              ? input.tags && input.tags.length > 0
                ? JSON.stringify(input.tags)
                : null
              : card.tags,
          updatedAt: new Date(),
        };

        return {
          ...old,
          cardsById: { ...old.cardsById, [input.id]: updatedCard },
        };
      });

      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toastManager.add({ type: "error", title: "Failed to update card" });
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
        return moveCardInBoard(old, input.cardId, input.columnId, input.position);
      });

      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toastManager.add({ type: "error", title: "Failed to move card" });
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

        const card = old.cardsById[input.id];
        if (!card) return old;

        // Remove from cardsById
        const { [input.id]: _removed, ...cardsById } = old.cardsById;
        void _removed;

        // Remove from cardIdsByColumn
        const cardIdsByColumn = {
          ...old.cardIdsByColumn,
          [card.columnId]: old.cardIdsByColumn[card.columnId]!.filter(
            (id) => id !== input.id,
          ),
        };

        return { ...old, cardsById, cardIdsByColumn };
      });

      return { previous };
    },
    onSuccess: () => {
      toastManager.add({ type: "success", title: "Card deleted" });
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toastManager.add({ type: "error", title: "Failed to delete card" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
