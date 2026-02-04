import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/b")({
  component: BoardLayout,
});

function BoardLayout() {
  return (
    <div className="flex h-svh flex-col overflow-hidden p-2">
      <main className="flex flex-1 flex-col overflow-hidden rounded border">
        <Outlet />
      </main>
    </div>
  );
}
