import { atom } from "jotai";

export const dialogAtom = atom<{
  open: boolean;
  mode: "create" | "edit";
  cardId?: string;
  columnId?: string;
}>({ open: false, mode: "create" });

export type DragState = {
  activeId: string | null;
  type: "card" | null;
  targetColumnId: string | null;
  insertIndex: number | null;
};

export const INITIAL_DRAG_STATE: DragState = {
  activeId: null,
  type: null,
  targetColumnId: null,
  insertIndex: null,
};

export const dragStateAtom = atom<DragState>(INITIAL_DRAG_STATE);
