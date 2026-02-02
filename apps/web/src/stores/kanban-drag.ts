import { atom } from "jotai";

export type DragState = {
  activeId: string | null;
  targetColumnId: string | null;
};

export const INITIAL_DRAG_STATE: DragState = {
  activeId: null,
  targetColumnId: null,
};

export const dragStateAtom = atom<DragState>(INITIAL_DRAG_STATE);

// Derived atoms for granular subscriptions
export const activeIdAtom = atom((get) => get(dragStateAtom).activeId);
export const targetColumnIdAtom = atom((get) => get(dragStateAtom).targetColumnId);
