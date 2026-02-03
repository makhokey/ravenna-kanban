import { useAtomValue } from "jotai";
import { Kanban } from "~/components/kanban";
import { TableView } from "~/components/table";
import { viewModeAtom } from "~/atoms/board";

export function BoardContainer() {
  const viewMode = useAtomValue(viewModeAtom);

  return (
    <div className="min-w-0 flex-1 overflow-hidden">
      {viewMode === "kanban" ? <Kanban /> : <TableView />}
    </div>
  );
}
