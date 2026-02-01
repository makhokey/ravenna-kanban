import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { Board } from "~/components/kanban/board";
import { CardDialog } from "~/components/kanban/card-dialog";
import { FilterBar } from "~/components/kanban/filter-bar";
import { boardQueryOptions } from "~/hooks/use-board";

export const Route = createFileRoute("/board/")({
  loader: ({ context }) => {
    context.queryClient.prefetchQuery(boardQueryOptions);
  },
  component: BoardPage,
});

function BoardPage() {
  return (
    <>
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center">
            <div className="text-muted-foreground">Loading board...</div>
          </div>
        }
      >
        <FilterBar />
        <Board />
      </Suspense>
      <CardDialog />
    </>
  );
}
