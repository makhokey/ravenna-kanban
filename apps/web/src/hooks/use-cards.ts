import { toastManager } from "@repo/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateKeyBetween } from "fractional-indexing";
import { comparePosition } from "~/lib/position";
import { createCard, deleteCard, moveCard, updateCard } from "~/server/cards";
import type { StatusValue } from "~/types/board";
import { boardKeys } from "./query-keys";
import { BoardData, DEFAULT_BOARD_ID } from "./use-board";

type CreateCardInput = {
  title: string;
  description?: string;
  boardId: string;
  status: StatusValue;
  // null = no priority, undefined = not provided
  priority?: "low" | "medium" | "high" | "urgent" | null;
  // null = no tags, undefined = not provided
  tags?: string[] | null;
};

type UpdateCardInput = {
  id: string;
  title?: string;
  description?: string;
  // null = clear priority, undefined = unchanged
  priority?: "low" | "medium" | "high" | "urgent" | null;
  // null = clear status, undefined = unchanged
  status?: "backlog" | "todo" | "in_progress" | "review" | "done" | null;
  // null = clear tags, undefined = unchanged
  tags?: string[] | null;
};

type MoveCardInput = {
  cardId: string;
  status: StatusValue;
  position: string; // Fractional index
  boardId: string;
  priority?: string | null; // Optional priority change for cross-priority moves
};

type DeleteCardInput = {
  id: string;
};

// Helper: Update card position in normalized board (for optimistic updates)
function moveCardInBoard(
  board: BoardData,
  cardId: string,
  targetStatus: StatusValue,
  newPosition: string,
  targetPriority?: string | null,
): BoardData {
  const card = board.cardsById[cardId];
  if (!card) return board;

  const sourceStatus = (card.status as StatusValue) || "backlog";
  const sourcePriority = card.priority || "none";
  const newPriority = targetPriority !== undefined ? (targetPriority || "none") : sourcePriority;

  // Update card with new status, position, and optionally priority
  const updatedCard = {
    ...card,
    status: targetStatus,
    position: newPosition,
    priority: targetPriority !== undefined ? targetPriority : card.priority,
  };

  // Update lookup tables
  const cardsById = { ...board.cardsById, [cardId]: updatedCard };

  // Update source status group's card IDs (remove)
  const sourceCardIds = board.cardIdsByStatus[sourceStatus].filter(
    (id) => id !== cardId,
  );

  // Update target status group's card IDs (insert sorted)
  const targetCardIds =
    sourceStatus === targetStatus
      ? sourceCardIds
      : [...board.cardIdsByStatus[targetStatus]];

  // Insert at correct position (find insertion point)
  const insertIdx = targetCardIds.findIndex(
    (id) => comparePosition(cardsById[id]!.position, newPosition) > 0,
  );
  targetCardIds.splice(insertIdx === -1 ? targetCardIds.length : insertIdx, 0, cardId);

  const cardIdsByStatus = {
    ...board.cardIdsByStatus,
    [sourceStatus]: sourceCardIds,
    [targetStatus]: targetCardIds,
  };

  // Update cardIdsByPriority - handles both same-group reorder and cross-group moves
  const cardIdsByPriority = { ...board.cardIdsByPriority };

  if (sourcePriority === newPriority) {
    // Same priority group - reorder within
    const priorityCardIds = (board.cardIdsByPriority[sourcePriority] ?? []).filter(
      (id) => id !== cardId,
    );
    const priorityInsertIdx = priorityCardIds.findIndex(
      (id) => comparePosition(cardsById[id]!.position, newPosition) > 0,
    );
    priorityCardIds.splice(
      priorityInsertIdx === -1 ? priorityCardIds.length : priorityInsertIdx,
      0,
      cardId,
    );
    cardIdsByPriority[sourcePriority] = priorityCardIds;
  } else {
    // Cross-priority move - remove from source, add to target
    cardIdsByPriority[sourcePriority] = (board.cardIdsByPriority[sourcePriority] ?? []).filter(
      (id) => id !== cardId,
    );
    const targetPriorityCardIds = [...(board.cardIdsByPriority[newPriority] ?? [])];
    const priorityInsertIdx = targetPriorityCardIds.findIndex(
      (id) => comparePosition(cardsById[id]!.position, newPosition) > 0,
    );
    targetPriorityCardIds.splice(
      priorityInsertIdx === -1 ? targetPriorityCardIds.length : priorityInsertIdx,
      0,
      cardId,
    );
    cardIdsByPriority[newPriority] = targetPriorityCardIds;
  }

  return { ...board, cardsById, cardIdsByStatus, cardIdsByPriority };
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
        const statusCardIds = old.cardIdsByStatus[input.status] ?? [];

        // Get last card's position for fractional indexing
        const lastCardId = statusCardIds[statusCardIds.length - 1];
        const lastPosition = lastCardId
          ? (old.cardsById[lastCardId]?.position ?? null)
          : null;
        const newPosition = generateKeyBetween(lastPosition, null);

        const priorityKey = input.priority || "none";
        const priorityCardIds = old.cardIdsByPriority[priorityKey] ?? [];

        const newCard = {
          id: tempId,
          displayId: null, // Will be set by server
          title: input.title,
          description: input.description ?? null,
          boardId: input.boardId,
          // null or undefined both mean no priority
          priority: input.priority ?? null,
          status: input.status,
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
          cardIdsByStatus: {
            ...old.cardIdsByStatus,
            [input.status]: [...statusCardIds, tempId],
          },
          cardIdsByPriority: {
            ...old.cardIdsByPriority,
            [priorityKey]: [...priorityCardIds, tempId],
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
          // status is required, never null - undefined means unchanged
          status: input.status !== undefined && input.status !== null
            ? input.status
            : card.status,
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
        return moveCardInBoard(old, input.cardId, input.status, input.position, input.priority);
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

        const status = (card.status as StatusValue) || "backlog";
        const priorityKey = card.priority || "none";

        // Remove from cardsById
        const { [input.id]: _removed, ...cardsById } = old.cardsById;
        void _removed;

        // Remove from cardIdsByStatus
        const cardIdsByStatus = {
          ...old.cardIdsByStatus,
          [status]: old.cardIdsByStatus[status].filter((id) => id !== input.id),
        };

        // Remove from cardIdsByPriority
        const cardIdsByPriority = {
          ...old.cardIdsByPriority,
          [priorityKey]: (old.cardIdsByPriority[priorityKey] ?? []).filter(
            (id) => id !== input.id,
          ),
        };

        return { ...old, cardsById, cardIdsByStatus, cardIdsByPriority };
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
