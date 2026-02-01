import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createColumn, deleteColumn, updateColumn } from "~/server/boards";
import { boardKeys } from "./query-keys";
import { BoardData, DEFAULT_BOARD_ID } from "./use-board";

type CreateColumnInput = {
  boardId: string;
  name: string;
};

type UpdateColumnInput = {
  id: string;
  name?: string;
};

type DeleteColumnInput = {
  id: string;
};

export function useCreateColumn() {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(DEFAULT_BOARD_ID);

  return useMutation({
    mutationFn: (input: CreateColumnInput) => createColumn({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<BoardData>(queryKey);

      // Optimistically add the column
      queryClient.setQueryData<BoardData>(queryKey, (old) => {
        if (!old) return old;

        const tempId = `temp-${Date.now()}`;
        const newColumn = {
          id: tempId,
          name: input.name,
          position: old.columnIds.length,
          boardId: input.boardId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return {
          ...old,
          columnIds: [...old.columnIds, tempId],
          columnsById: { ...old.columnsById, [tempId]: newColumn },
          cardIdsByColumn: { ...old.cardIdsByColumn, [tempId]: [] },
        };
      });

      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error("Failed to create column");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(DEFAULT_BOARD_ID);

  return useMutation({
    mutationFn: (input: UpdateColumnInput) => updateColumn({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<BoardData>(queryKey);

      // Optimistically update the column
      queryClient.setQueryData<BoardData>(queryKey, (old) => {
        if (!old) return old;

        const column = old.columnsById[input.id];
        if (!column) return old;

        const updatedColumn = {
          ...column,
          name: input.name ?? column.name,
          updatedAt: new Date(),
        };

        return {
          ...old,
          columnsById: { ...old.columnsById, [input.id]: updatedColumn },
        };
      });

      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error("Failed to update column");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();
  const queryKey = boardKeys.detail(DEFAULT_BOARD_ID);

  return useMutation({
    mutationFn: (input: DeleteColumnInput) => deleteColumn({ data: input }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<BoardData>(queryKey);

      // Optimistically remove the column
      queryClient.setQueryData<BoardData>(queryKey, (old) => {
        if (!old) return old;

        // Remove from columnIds
        const columnIds = old.columnIds.filter((id) => id !== input.id);

        // Remove from columnsById
        const { [input.id]: _removedCol, ...columnsById } = old.columnsById;
        void _removedCol;

        // Remove cards that belong to this column from cardsById
        const cardIdsToRemove = old.cardIdsByColumn[input.id] ?? [];
        const cardsById = { ...old.cardsById };
        for (const cardId of cardIdsToRemove) {
          delete cardsById[cardId];
        }

        // Remove from cardIdsByColumn
        const { [input.id]: _removedCards, ...cardIdsByColumn } = old.cardIdsByColumn;
        void _removedCards;

        // Update column positions
        const updatedColumnsById = { ...columnsById };
        columnIds.forEach((id, idx) => {
          if (updatedColumnsById[id]!.position !== idx) {
            updatedColumnsById[id] = { ...updatedColumnsById[id]!, position: idx };
          }
        });

        return {
          ...old,
          columnIds,
          columnsById: updatedColumnsById,
          cardsById,
          cardIdsByColumn,
        };
      });

      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(queryKey, ctx.previous);
      }
      toast.error("Failed to delete column");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
