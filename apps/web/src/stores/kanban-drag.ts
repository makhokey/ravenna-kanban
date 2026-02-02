import { atom } from "jotai";

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

// Derived atoms for granular subscriptions
export const activeIdAtom = atom((get) => get(dragStateAtom).activeId);
export const targetColumnIdAtom = atom((get) => get(dragStateAtom).targetColumnId);
export const insertIndexAtom = atom((get) => get(dragStateAtom).insertIndex);
