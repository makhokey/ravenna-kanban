import { Button } from "@repo/ui/components/button";
import { Field } from "@repo/ui/components/field";
import { Form } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Kbd, KbdGroup } from "@repo/ui/components/kbd";
import { Textarea } from "@repo/ui/components/textarea";
import { toastManager } from "@repo/ui/components/toast";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useForm } from "@tanstack/react-form-start";
import { useAtom } from "jotai";
import { LoaderIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import { useBoard } from "~/hooks/use-board";
import { useCreateCard, useUpdateCard } from "~/hooks/use-cards";
import { panelAtom } from "~/stores/board";
import {
  cardFormSchema,
  getColumnStatus,
  safeParseJsonTags,
  type CardFormOutput,
  type CardFormValues,
  type PriorityValue,
  type StatusValue,
} from "./card-schema";
import { PrioritySelect } from "./priority-select";
import { StatusSelect } from "./status-select";
import { TagSelect } from "./tag-select";
import { Separator } from "@repo/ui/components/separator";

export function CardPanel() {
  const [panel, setPanel] = useAtom(panelAtom);
  const { data: board } = useBoard();
  const panelRef = useRef<HTMLDivElement>(null);

  const createCard = useCreateCard();
  const updateCard = useUpdateCard();

  const existingCard =
    panel.mode === "edit" && panel.cardId ? board?.cardsById[panel.cardId] : null;

  // Get column name for status auto-selection
  const column = panel.columnId ? board?.columnsById[panel.columnId] : null;

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

  const closePanel = () => setPanel({ open: false, mode: "create" });

  const handleFormSubmit = (data: CardFormOutput) => {
    if (panel.mode === "create" && panel.columnId) {
      createCard.mutate(
        {
          title: data.title,
          description: data.description,
          columnId: panel.columnId,
          priority: data.priority,
          status: data.status,
          tags: data.tags,
        },
        { onSuccess: closePanel },
      );
    } else if (panel.mode === "edit" && panel.cardId) {
      updateCard.mutate(
        {
          id: panel.cardId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          tags: data.tags,
        },
        {
          onSuccess: () => {
            toastManager.add({ type: "success", title: "Card updated" });
            closePanel();
          },
        },
      );
    }
  };

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

  useEffect(() => {
    if (panel.open) {
      form.reset(getDefaultValues());
    }
  }, [panel.open, existingCard, form, getDefaultValues]);

  const isPending = createCard.isPending || updateCard.isPending;

  useEffect(() => {
    if (!panel.open) return;

    const panelEl = panelRef.current;
    if (!panelEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        form.handleSubmit();
      }
    };

    panelEl.addEventListener("keydown", handleKeyDown);
    return () => panelEl.removeEventListener("keydown", handleKeyDown);
  }, [panel.open, form]);

  if (!panel.open) return null;

  return (
    <div
      ref={panelRef}
      className="w-96 flex-shrink-0 border-l bg-background flex flex-col"
    >
      <Form className="flex flex-col h-full">
        {/* Header with title input and close button */}
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <div className="flex-1">
          
          </div>
          <Button variant="ghost" size="icon-sm" onClick={closePanel}>
            <XIcon />
          </Button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <form.Field name="title">
              {(field) => (
                <Field>
                  <Input
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Issue title"
                    className="border-0 px-0 text-lg! font-medium shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    autoFocus
                  />
                </Field>
              )}
            </form.Field>
          <form.Field name="description">
            {(field) => (
              <Field>
                <Textarea
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Description..."
                  unstyled
                  className="min-h-32 max-h-42 overflow-y-auto text-base w-full [&_textarea]:resize-none [&_textarea]:px-0"
                />
              </Field>
            )}
          </form.Field>
          {/* Properties section */}
          <div className="flex flex-col gap-3 py-3 mt-2">
            {/* Status row */}
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm w-20">Status</span>
              <form.Field name="status">
                {(field) => (
                  <StatusSelect
                    value={field.state.value as StatusValue}
                    onChange={(val) => field.handleChange(val)}
                  />
                )}
              </form.Field>
            </div>

            {/* Priority row */}
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm w-20">Priority</span>
              <form.Field name="priority">
                {(field) => (
                  <PrioritySelect
                    value={(field.state.value ?? "no priority") as PriorityValue}
                    onChange={(val) => field.handleChange(val)}
                  />
                )}
              </form.Field>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm w-20">Tags</span>
              <form.Field name="tags">
                {(field) => (
                  <TagSelect
                    value={field.state.value ?? []}
                    onChange={(val) => field.handleChange(val)}
                  />
                )}
              </form.Field>
            </div>
          </div>
          </div>
          <Separator />
        </div>
        

        {/* Footer with selectors and save button */}
        <div className="flex items-center justify-end px-4 py-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="sm"
                  disabled={isPending}
                  onClick={() => form.handleSubmit()}
                >
                  {isPending ? (
                    <>
                      <LoaderIcon className="size-4 animate-spin" />
                      {panel.mode === "create" ? "Creating" : "Saving"}
                    </>
                  ) : panel.mode === "create" ? (
                    "Create"
                  ) : (
                    "Save"
                  )}
                </Button>
              }
            />
            <TooltipPopup>
              {panel.mode === "create" ? "Create" : "Save"}
              <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>↵</Kbd>
              </KbdGroup>
            </TooltipPopup>
          </Tooltip>
        </div>
      </Form>
    </div>
  );
}
