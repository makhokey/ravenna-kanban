import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCard, deleteCard, moveCard, updateCard } from "~/server/cards";

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

export function useCreateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCardInput) => createCard({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board"] }),
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCardInput) => updateCard({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board"] }),
  });
}

export function useMoveCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MoveCardInput) => moveCard({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board"] }),
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DeleteCardInput) => deleteCard({ data: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board"] }),
  });
}
