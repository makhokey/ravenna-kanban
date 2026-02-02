import { useAtomValue } from "jotai";
import { KanbanBoard } from "~/components/kanban";
import { TableView } from "~/components/table";
import { viewModeAtom } from "~/stores/board";

export function BoardContainer() {
  const viewMode = useAtomValue(viewModeAtom);

  return viewMode === "kanban" ? <KanbanBoard /> : <TableView />;
}
