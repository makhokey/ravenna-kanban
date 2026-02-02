import { toastManager } from "@repo/ui/components/toast";
import { useForm } from "@tanstack/react-form-start";
import { useCallback, useEffect, useRef } from "react";
import {
  cardFormSchema,
  getColumnStatus,
  safeParseJsonTags,
  type CardFormOutput,
  type CardFormValues,
  type PriorityValue,
  type StatusValue,
} from "~/components/shared/card-schema";
import type { CardEditorState } from "~/stores/board";
import type { CardData, ColumnData } from "~/types/board";
import { useBoard } from "./use-board";
import { useCreateCard, useUpdateCard } from "./use-cards";

type UseCardFormOptions = {
  editorState: CardEditorState;
  onClose: () => void;
  autoSave?: boolean;
};

export function useCardForm({
  editorState,
  onClose,
  autoSave = false,
}: UseCardFormOptions) {
  const { data: board } = useBoard();
  const containerRef = useRef<HTMLDivElement>(null);

  const createCard = useCreateCard();
  const updateCard = useUpdateCard();

  const existingCard: CardData | null =
    editorState.mode === "edit" && editorState.cardId
      ? (board?.cardsById[editorState.cardId] ?? null)
      : null;

  const column: ColumnData | null = editorState.columnId
    ? (board?.columnsById[editorState.columnId] ?? null)
    : null;

  const getDefaultValues = useCallback((): CardFormValues => {
    if (existingCard) {
      const tags = safeParseJsonTags(existingCard.tags);
      return {
        title: existingCard.title,
        description: existingCard.description ?? "",
        priority: (existingCard.priority as PriorityValue) ?? "no priority",
        status: (existingCard.status as StatusValue) ?? "backlog",
        tags,
      };
    }
    // Auto-select status based on column name for new cards
    const columnStatus = column ? getColumnStatus(column.name) : null;
    return {
      title: "",
      description: "",
      priority: "no priority",
      status: columnStatus ?? "backlog",
      tags: [],
    };
  }, [existingCard, column]);

  const handleFormSubmit = useCallback(
    (data: CardFormOutput) => {
      if (editorState.mode === "create" && editorState.columnId) {
        createCard.mutate(
          {
            title: data.title,
            description: data.description,
            columnId: editorState.columnId,
            priority: data.priority,
            status: data.status,
            tags: data.tags,
          },
          { onSuccess: onClose },
        );
      } else if (editorState.mode === "edit" && editorState.cardId) {
        updateCard.mutate(
          {
            id: editorState.cardId,
            title: data.title,
            description: data.description,
            priority: data.priority,
            status: data.status,
            tags: data.tags,
          },
          {
            onSuccess: () => {
              toastManager.add({ type: "success", title: "Card updated" });
              onClose();
            },
          },
        );
      }
    },
    [editorState, createCard, updateCard, onClose],
  );

  const form = useForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      const result = cardFormSchema.safeParse(value);
      if (!result.success) {
        toastManager.add({ title: "Title is required", type: "error" });
        return;
      }
      handleFormSubmit(result.data);
    },
  });

  // Reset form when editor opens or card changes
  useEffect(() => {
    if (editorState.open) {
      form.reset(getDefaultValues());
    }
  }, [editorState.open, existingCard, form, getDefaultValues]);

  // Keyboard shortcut: Cmd+Enter to submit
  useEffect(() => {
    if (!editorState.open) return;

    const containerEl = containerRef.current;
    if (!containerEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        form.handleSubmit();
      }
    };

    containerEl.addEventListener("keydown", handleKeyDown);
    return () => containerEl.removeEventListener("keydown", handleKeyDown);
  }, [editorState.open, form]);

  const isPending = createCard.isPending || updateCard.isPending;

  // Auto-save handlers (only used when autoSave is true)
  const handleStatusChange = useCallback(
    (status: StatusValue) => {
      if (autoSave && editorState.mode === "edit" && editorState.cardId) {
        updateCard.mutate({ id: editorState.cardId, status });
      }
    },
    [autoSave, editorState, updateCard],
  );

  const handlePriorityChange = useCallback(
    (priority: PriorityValue) => {
      if (autoSave && editorState.mode === "edit" && editorState.cardId) {
        updateCard.mutate({
          id: editorState.cardId,
          priority: priority === "no priority" ? null : priority,
        });
      }
    },
    [autoSave, editorState, updateCard],
  );

  const handleTagsChange = useCallback(
    (tags: string[]) => {
      if (autoSave && editorState.mode === "edit" && editorState.cardId) {
        updateCard.mutate({
          id: editorState.cardId,
          tags: tags.length > 0 ? tags : null,
        });
      }
    },
    [autoSave, editorState, updateCard],
  );

  return {
    form,
    isPending,
    existingCard,
    containerRef,
    mode: editorState.mode,
    // Auto-save handlers
    handleStatusChange,
    handlePriorityChange,
    handleTagsChange,
  };
}
