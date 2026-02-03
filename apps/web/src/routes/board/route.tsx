import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/board")({
  component: BoardLayout,
});

function BoardLayout() {
  return (
    <div className="flex p-2 h-svh flex-col overflow-hidden">
      <main className="flex flex-1 flex-col overflow-hidden rounded border">
        <Outlet />
      </main>
    </div>
  );
}
