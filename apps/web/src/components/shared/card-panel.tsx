import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { Field } from "@repo/ui/components/field";
import { Form } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Separator } from "@repo/ui/components/separator";
import { Textarea } from "@repo/ui/components/textarea";
import { useAtom } from "jotai";
import { ChevronDown, ChevronUp, Trash2, XIcon } from "lucide-react";
import { useState } from "react";
import { useBoard } from "~/hooks/use-board";
import { useCardForm } from "~/hooks/use-card-form";
import { useDeleteCard } from "~/hooks/use-cards";
import { panelAtom } from "~/atoms/board";
import type { PriorityValue, StatusValue } from "./card-schema";
import { PrioritySelect } from "./priority-select";
import { StatusSelect } from "./status-select";
import { TagSelect } from "./tag-select";

export function CardPanel() {
  const [panel, setPanel] = useAtom(panelAtom);
  const { data: board } = useBoard();
  const deleteCard = useDeleteCard();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const closePanel = () => setPanel({ open: false, mode: "create" });

  const handleDelete = () => {
    if (panel.cardId) {
      deleteCard.mutate({ id: panel.cardId });
      setDeleteDialogOpen(false);
      closePanel();
    }
  };

  // Get the card's status for navigation
  const card = panel.cardId ? board?.cardsById[panel.cardId] : null;
  const cardStatus = (card?.status ?? panel.status ?? "backlog") as
    | "backlog"
    | "todo"
    | "in_progress"
    | "review"
    | "done";

  // Navigation between cards in the same status group
  const cardIds = board?.cardIdsByStatus[cardStatus] ?? [];
  const currentIndex = cardIds.indexOf(panel.cardId ?? "");
  const canGoUp = currentIndex > 0;
  const canGoDown = currentIndex >= 0 && currentIndex < cardIds.length - 1;

  const goUp = () => {
    if (canGoUp) {
      setPanel({ ...panel, cardId: cardIds[currentIndex - 1] });
    }
  };

  const goDown = () => {
    if (canGoDown) {
      setPanel({ ...panel, cardId: cardIds[currentIndex + 1] });
    }
  };

  const {
    form,
    existingCard,
    containerRef,
    handleStatusChange,
    handlePriorityChange,
    handleTagsChange,
    handleTitleChange,
    handleDescriptionChange,
  } = useCardForm({
    editorState: panel,
    onClose: closePanel,
    autoSave: true,
  });

  if (!panel.open) return null;

  return (
    <div
      ref={containerRef}
      className="bg-card flex w-82 flex-shrink-0 flex-col border-l"
    >
      <Form className="flex h-full flex-col">
        {/* Header with card ID, navigation, and close button */}
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          {existingCard && (
            <span className="text-card-foreground text-sm font-medium">
              {existingCard.displayId ?? existingCard.id.slice(0, 8).toUpperCase()}
            </span>
          )}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={goUp}
              disabled={!canGoUp}
              aria-label="Previous card"
            >
              <ChevronUp className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={goDown}
              disabled={!canGoDown}
              aria-label="Next card"
            >
              <ChevronDown className="size-3" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={closePanel}>
              <XIcon className="size-3" />
            </Button>
          </div>
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
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      handleTitleChange(e.target.value);
                    }}
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
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                      handleDescriptionChange(e.target.value);
                    }}
                    placeholder="Description..."
                    unstyled
                    className="max-h-42 min-h-32 w-full overflow-y-auto text-base [&_textarea]:resize-none [&_textarea]:px-0"
                  />
                </Field>
              )}
            </form.Field>
            {/* Properties section */}
            <div className="mt-2 flex flex-col gap-3 py-3">
              {/* Status row */}
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-20 text-sm">Status</span>
                <form.Field name="status">
                  {(field) => (
                    <StatusSelect
                      value={field.state.value as StatusValue}
                      onChange={(val) => {
                        field.handleChange(val);
                        handleStatusChange(val);
                      }}
                    />
                  )}
                </form.Field>
              </div>

              {/* Priority row */}
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-20 text-sm">Priority</span>
                <form.Field name="priority">
                  {(field) => (
                    <PrioritySelect
                      value={(field.state.value ?? "no priority") as PriorityValue}
                      onChange={(val) => {
                        field.handleChange(val);
                        handlePriorityChange(val);
                      }}
                    />
                  )}
                </form.Field>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-muted-foreground w-20 text-sm">Tags</span>
                <form.Field name="tags">
                  {(field) => (
                    <TagSelect
                      value={field.state.value ?? []}
                      onChange={(val) => {
                        field.handleChange(val);
                        handleTagsChange(val);
                      }}
                    />
                  )}
                </form.Field>
              </div>
                {existingCard && (
              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground w-20 text-sm">Delete</span>
              <Button
                variant="destructive"
                size="icon-sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          )}
            </div>
          </div>
          <Separator />

        
        </div>

      </Form>

      {/* Delete confirmation dialog */}
      {existingCard && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogPopup>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete card</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{existingCard.title}"? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="px-4 pb-4">
              <AlertDialogClose render={<Button variant="outline" size="sm">Cancel</Button>} />
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogPopup>
        </AlertDialog>
      )}
    </div>
  );
}
