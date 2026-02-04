import { Button } from "@repo/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createDefaultBoard } from "~/server/boards";

export const Route = createFileRoute("/board/setup")({
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();

  const createBoard = useMutation({
    mutationFn: () => createDefaultBoard({}),
    onSuccess: () => {
      navigate({ to: "/board" });
    },
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Welcome to Ravenna Kanban</h2>
        <p className="text-muted-foreground mt-2">
          Get started by creating your first board.
        </p>
      </div>

      <Button
        size="lg"
        onClick={() => createBoard.mutate()}
        disabled={createBoard.isPending}
      >
        {createBoard.isPending ? "Creating..." : "Create Board"}
      </Button>

      {createBoard.isError && (
        <p className="text-destructive text-sm">
          Error creating board. Please try again.
        </p>
      )}
    </div>
  );
}
