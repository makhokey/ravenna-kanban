import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/board")({
  component: BoardLayout,
});

function BoardLayout() {
  return (
        <div className="flex h-svh flex-col">
      <main className="m-2 border rounded-lg flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
