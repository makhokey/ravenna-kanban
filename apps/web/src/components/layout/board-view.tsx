import { useAtomValue } from "jotai";
import { viewModeAtom } from "~/atoms/board-atoms";
import { KanbanView } from "~/components/kanban";
import { TableView } from "~/components/table";

export function BoardView() {
  const viewMode = useAtomValue(viewModeAtom);

  return (
    <div className="min-w-0 flex-1 overflow-hidden">
      {viewMode === "kanban" ? <KanbanView /> : <TableView />}
    </div>
  );
}
