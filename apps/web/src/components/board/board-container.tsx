import { useAtomValue } from "jotai";
import { KanbanBoard } from "~/components/kanban";
import { TableView } from "~/components/table";
import { viewModeAtom } from "~/stores/board";

export function BoardContainer() {
  const viewMode = useAtomValue(viewModeAtom);

  return (
    <div className="flex-1 min-w-0 overflow-hidden">
      {viewMode === "kanban" ? <KanbanBoard /> : <TableView />}
    </div>
  );
}
