import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createColumn, deleteColumn, updateColumn } from "~/server/boards";

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
  return useMutation({
    mutationFn: (input: CreateColumnInput) => createColumn({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board"] }),
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateColumnInput) => updateColumn({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board"] }),
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteColumnInput) => deleteColumn({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board"] }),
  });
}
