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

        const newColumn = {
          id: `temp-${Date.now()}`,
          name: input.name,
          position: old.columns.length,
          boardId: input.boardId,
          cards: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return {
          ...old,
          columns: [...old.columns, newColumn],
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

        const columns = old.columns.map((col) => {
          if (col.id !== input.id) return col;
          return {
            ...col,
            name: input.name ?? col.name,
            updatedAt: new Date(),
          };
        });

        return { ...old, columns };
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

        const columns = old.columns
          .filter((col) => col.id !== input.id)
          .map((col, idx) => ({ ...col, position: idx }));

        return { ...old, columns };
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
