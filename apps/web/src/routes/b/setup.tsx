import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CreateBoardForm } from "~/components/board";

export const Route = createFileRoute("/b/setup")({
  component: SetupPage,
});

function SetupPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Welcome to Ravenna Kanban</h2>
        <p className="text-muted-foreground mt-2">
          Get started by creating your first board.
        </p>
      </div>

      <CreateBoardForm
        onSuccess={(slug) =>
          navigate({ to: "/b/$boardSlug", params: { boardSlug: slug } })
        }
      />
    </div>
  );
}
