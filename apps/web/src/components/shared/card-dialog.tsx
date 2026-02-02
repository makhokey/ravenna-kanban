import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
} from "@repo/ui/components/dialog";
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
import { dialogAtom } from "~/stores/board";
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

export function CardDialog() {
  const [dialog, setDialog] = useAtom(dialogAtom);
  const { data: board } = useBoard();
  const dialogRef = useRef<HTMLDivElement>(null);

  const createCard = useCreateCard();
  const updateCard = useUpdateCard();

  const existingCard =
    dialog.mode === "edit" && dialog.cardId ? board?.cardsById[dialog.cardId] : null;

  // Get column name for status auto-selection
  const column = dialog.columnId ? board?.columnsById[dialog.columnId] : null;

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

  const closeDialog = () => setDialog({ open: false, mode: "create" });

  const handleFormSubmit = (data: CardFormOutput) => {
    if (dialog.mode === "create" && dialog.columnId) {
      createCard.mutate(
        {
          title: data.title,
          description: data.description,
          columnId: dialog.columnId,
          priority: data.priority,
          status: data.status,
          tags: data.tags,
        },
        { onSuccess: closeDialog },
      );
    } else if (dialog.mode === "edit" && dialog.cardId) {
      updateCard.mutate(
        {
          id: dialog.cardId,
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: data.status,
          tags: data.tags,
        },
        {
          onSuccess: () => {
            toastManager.add({ type: "success", title: "Card updated" });
            closeDialog();
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
    if (dialog.open) {
      form.reset(getDefaultValues());
    }
  }, [dialog.open, existingCard, form, getDefaultValues]);

  const isPending = createCard.isPending || updateCard.isPending;

  useEffect(() => {
    if (!dialog.open) return;

    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        form.handleSubmit();
      }
    };

    dialogEl.addEventListener("keydown", handleKeyDown);
    return () => dialogEl.removeEventListener("keydown", handleKeyDown);
  }, [dialog.open, form]);

  return (
    <Dialog open={dialog.open} onOpenChange={(open) => !open && closeDialog()}>
      <DialogPopup ref={dialogRef} showCloseButton={false}>
        <Form className="contents">
          <DialogHeader className="flex flex-row items-center justify-between px-4 py-2 pb-0!">
            <div className="w-full flex-1">
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
            </div>

            <DialogClose tabIndex={-1} render={<Button variant="link" size="icon-sm" />}>
              <XIcon />
            </DialogClose>
          </DialogHeader>

          <DialogPanel className="px-4">
            <form.Field name="description">
              {(field) => (
                <Field>
                  <Textarea
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Description..."
                    unstyled
                    className="max-h-40 w-full overflow-y-auto text-base [&_textarea]:resize-none [&_textarea]:px-0"
                  />
                </Field>
              )}
            </form.Field>
          </DialogPanel>

          <DialogFooter className="flex items-center justify-between px-4 py-2">
            <div className="flex w-full items-center gap-1">
              <form.Field name="status">
                {(field) => (
                  <StatusSelect
                    value={field.state.value as StatusValue}
                    onChange={(val) => field.handleChange(val)}
                  />
                )}
              </form.Field>

              <form.Field name="priority">
                {(field) => (
                  <PrioritySelect
                    value={(field.state.value ?? "no priority") as PriorityValue}
                    onChange={(val) => field.handleChange(val)}
                  />
                )}
              </form.Field>

              <form.Field name="tags">
                {(field) => (
                  <TagSelect
                    value={field.state.value ?? []}
                    onChange={(val) => field.handleChange(val)}
                  />
                )}
              </form.Field>
            </div>

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
                        {dialog.mode === "create" ? "Creating" : "Saving"}
                      </>
                    ) : dialog.mode === "create" ? (
                      "Create"
                    ) : (
                      "Save"
                    )}
                  </Button>
                }
              />
              <TooltipPopup>
                {dialog.mode === "create" ? "Create" : "Save"}
                <KbdGroup>
                  <Kbd>⌘</Kbd>
                  <Kbd>↵</Kbd>
                </KbdGroup>
              </TooltipPopup>
            </Tooltip>
          </DialogFooter>
        </Form>
      </DialogPopup>
    </Dialog>
  );
}
