import { createFileRoute, useParams, useRouteContext } from "@tanstack/react-router";
import { Suspense } from "react";
import { getBoardSettings } from "~/api/board-api";
import { CardDialog, CardPanel } from "~/components/card-editor";
import { AdminPopover, BoardFilter, BoardView } from "~/components/layout";
import { SettingsHydrator } from "~/components/settings-hydrator";
import { BoardProvider } from "~/contexts/board-context";
import { boardQueryOptions } from "~/hooks/use-board";

export const Route = createFileRoute("/b/$boardSlug")({
  beforeLoad: async () => {
    const settings = await getBoardSettings();
    return { settings };
  },
  loader: async ({ context, params }) => {
    const board = await context.queryClient.ensureQueryData(
      boardQueryOptions(params.boardSlug),
    );
    return { board };
  },
  component: BoardPage,
});

function BoardPage() {
  const { settings } = useRouteContext({ from: "/b/$boardSlug" });
  const { boardSlug } = useParams({ from: "/b/$boardSlug" });

  return (
    <BoardProvider boardSlug={boardSlug}>
      <SettingsHydrator settings={settings}>
        <Suspense
          fallback={
            <div className="flex flex-1 flex-col">
              {/* Filter bar skeleton */}
              <div className="border-b p-2">
                <div className="flex animate-pulse gap-2">
                  <div className="bg-muted h-9 w-32 rounded-md" />
                  <div className="bg-muted h-9 w-32 rounded-md" />
                  <div className="bg-muted ml-auto h-9 w-28 rounded-md" />
                </div>
              </div>
              {/* Board skeleton */}
              <div className="flex flex-1 gap-4 overflow-x-auto p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="bg-muted/50 h-full w-92 flex-shrink-0 animate-pulse rounded-lg border"
                  />
                ))}
              </div>
            </div>
          }
        >
          <BoardFilter />
          <div className="flex flex-1 overflow-hidden">
            <BoardView />
            <CardPanel />
          </div>
        </Suspense>
        <CardDialog />
        <AdminPopover />
      </SettingsHydrator>
    </BoardProvider>
  );
}
