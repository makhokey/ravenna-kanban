import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ThemeToggle } from "~/components/theme-toggle";

export const Route = createFileRoute("/board")({
  component: BoardLayout,
});

function BoardLayout() {
  return (
    <div className="flex h-svh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-base font-medium">Ravenna Kanban</h1>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
