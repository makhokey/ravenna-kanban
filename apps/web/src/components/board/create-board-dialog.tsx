import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toastManager } from "@repo/ui/components/toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid } from "lucide-react";
import { useId, useState } from "react";
import { createBoard } from "~/api/admin-api";
import { generatePrefix } from "~/lib/prefix";
import { slugify } from "~/lib/slugify";

interface CreateBoardFormProps {
  onSuccess?: (slug: string) => void;
}

export function CreateBoardForm({ onSuccess }: CreateBoardFormProps) {
  const id = useId();
  const queryClient = useQueryClient();
  const [boardName, setBoardName] = useState("");

  const createBoardMutation = useMutation({
    mutationFn: ({ name, slug }: { name: string; slug: string }) =>
      createBoard({ data: { name, slug } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boards", "list"] });
      setBoardName("");
      toastManager.add({
        title: "Board created",
        description: `"${data.name}" is ready to use.`,
        type: "success",
      });
      onSuccess?.(data.slug);
    },
  });

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmedName = boardName.trim();
    if (trimmedName) {
      const slug = slugify(trimmedName);
      createBoardMutation.mutate({ name: trimmedName, slug });
    }
  };

  const trimmedName = boardName.trim();
  const generatedSlug = trimmedName ? slugify(trimmedName) : "";
  const generatedPrefix = trimmedName ? generatePrefix(trimmedName) : "";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="*:not-first:mt-2">
        <Label htmlFor={`${id}-name`}>Board name</Label>
        <Input
          id={`${id}-name`}
          placeholder="My Board"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="*:not-first:mt-2">
        <Label htmlFor={`${id}-slug`}>Board URL</Label>
        <Input
          id={`${id}-slug`}
          value={generatedSlug ? `/b/${generatedSlug}` : ""}
          placeholder="/b/my-board"
          disabled
        />
      </div>
      <div className="*:not-first:mt-2">
        <Label htmlFor={`${id}-prefix`}>Card prefix</Label>
        <Input
          id={`${id}-prefix`}
          value={generatedPrefix ? `${generatedPrefix}-1, ${generatedPrefix}-2, ...` : ""}
          placeholder="MYB-1, MYB-2, ..."
          disabled
        />
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={!trimmedName || createBoardMutation.isPending}
      >
        {createBoardMutation.isPending ? "Creating..." : "Create Board"}
      </Button>
    </form>
  );
}

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (slug: string) => void;
}

export function CreateBoardDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateBoardDialogProps) {
  const id = useId();
  const queryClient = useQueryClient();
  const [boardName, setBoardName] = useState("");

  const createBoardMutation = useMutation({
    mutationFn: ({ name, slug }: { name: string; slug: string }) =>
      createBoard({ data: { name, slug } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boards", "list"] });
      setBoardName("");
      onOpenChange(false);
      toastManager.add({
        title: "Board created",
        description: `"${data.name}" is ready to use.`,
        type: "success",
      });
      onSuccess?.(data.slug);
    },
  });

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const trimmedName = boardName.trim();
    if (trimmedName) {
      const slug = slugify(trimmedName);
      createBoardMutation.mutate({ name: trimmedName, slug });
    }
  };

  const trimmedName = boardName.trim();
  const generatedSlug = trimmedName ? slugify(trimmedName) : "";
  const generatedPrefix = trimmedName ? generatePrefix(trimmedName) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full border">
              <LayoutGrid className="size-5" />
            </div>
            <DialogTitle className="sm:text-center">Create new board</DialogTitle>
            <DialogDescription className="sm:text-center">
              Enter a name for your new board.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6">
          <div className="*:not-first:mt-2">
            <Label htmlFor={`${id}-name`}>Board name</Label>
            <Input
              id={`${id}-name`}
              placeholder="My Board"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="*:not-first:mt-2">
            <Label htmlFor={`${id}-slug`}>Board URL</Label>
            <Input
              id={`${id}-slug`}
              value={generatedSlug ? `/b/${generatedSlug}` : ""}
              placeholder="/b/my-board"
              disabled
            />
          </div>
          <div className="*:not-first:mt-2">
            <Label htmlFor={`${id}-prefix`}>Prefix</Label>
            <Input
              id={`${id}-prefix`}
              value={
                generatedPrefix ? `${generatedPrefix}-1, ${generatedPrefix}-2, ...` : ""
              }
              placeholder="MYB-1, MYB-2, ..."
              disabled
            />
          </div>
        </form>

        <DialogFooter className="px-4 pb-4">
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!trimmedName || createBoardMutation.isPending}
          >
            {createBoardMutation.isPending ? "Creating..." : "Create Board"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
