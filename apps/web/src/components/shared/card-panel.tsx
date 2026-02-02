import { Button } from "@repo/ui/components/button";
import { Field } from "@repo/ui/components/field";
import { Form } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Kbd, KbdGroup } from "@repo/ui/components/kbd";
import { Separator } from "@repo/ui/components/separator";
import { Textarea } from "@repo/ui/components/textarea";
import { Tooltip, TooltipPopup, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useAtom } from "jotai";
import { LoaderIcon, XIcon } from "lucide-react";
import { useCardForm } from "~/hooks/use-card-form";
import { panelAtom } from "~/stores/board";
import type { PriorityValue, StatusValue } from "./card-schema";
import { PrioritySelect } from "./priority-select";
import { StatusSelect } from "./status-select";
import { TagSelect } from "./tag-select";

export function CardPanel() {
  const [panel, setPanel] = useAtom(panelAtom);

  const closePanel = () => setPanel({ open: false, mode: "create" });

  const {
    form,
    isPending,
    existingCard,
    containerRef,
    mode,
    handleStatusChange,
    handlePriorityChange,
    handleTagsChange,
  } = useCardForm({
    editorState: panel,
    onClose: closePanel,
    autoSave: true,
  });

  if (!panel.open) return null;

  return (
    <div
      ref={containerRef}
      className="bg-background flex w-96 flex-shrink-0 flex-col border-l"
    >
      <Form className="flex h-full flex-col">
        {/* Header with card ID and close button */}
        <div className="flex items-center gap-2 border-b px-4 py-2">
          {existingCard && (
            <span className="text-muted-foreground text-sm font-medium">
              {existingCard.displayId ?? existingCard.id.slice(0, 8).toUpperCase()}
            </span>
          )}
          <div className="flex-1"></div>
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
                      {mode === "create" ? "Creating" : "Saving"}
                    </>
                  ) : mode === "create" ? (
                    "Create"
                  ) : (
                    "Save"
                  )}
                </Button>
              }
            />
            <TooltipPopup>
              {mode === "create" ? "Create" : "Save"}
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
