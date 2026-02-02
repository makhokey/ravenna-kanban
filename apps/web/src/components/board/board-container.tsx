import { useAtomValue } from "jotai";
import { KanbanBoard } from "~/components/kanban";
import { TableView } from "~/components/table";
import { viewModeAtom } from "~/stores/board";

export function BoardContainer() {
  const viewMode = useAtomValue(viewModeAtom);

  return (
    <div className="min-w-0 flex-1 overflow-hidden">
      {viewMode === "kanban" ? <KanbanBoard /> : <TableView />}
    </div>
  );
}
