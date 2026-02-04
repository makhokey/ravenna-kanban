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
import { Tooltip, TooltipPopup, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useAtom } from "jotai";
import { LoaderIcon, XIcon } from "lucide-react";
import { dialogAtom } from "~/atoms/board-atoms";
import { useCardForm } from "~/hooks/use-card-form";
import type { PriorityValue, StatusValue } from "~/lib/card-config";
import { PrioritySelect } from "./priority-select";
import { StatusSelect } from "./status-select";
import { TagSelect } from "./tag-select";

export function CardDialog() {
  const [dialog, setDialog] = useAtom(dialogAtom);

  const closeDialog = () => setDialog({ open: false, mode: "create" });

  const { form, isPending, containerRef, mode } = useCardForm({
    editorState: dialog,
    onClose: closeDialog,
  });

  return (
    <Dialog open={dialog.open} onOpenChange={(open) => !open && closeDialog()}>
      <DialogPopup ref={containerRef} showCloseButton={false}>
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

          <DialogFooter className="flex items-center justify-between px-4 pb-4">
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
                    value={(field.state.value ?? "none") as PriorityValue}
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
                {mode === "create" ? "Create " : "Save "}
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
