import { atom } from "jotai";

export type DragState = {
  activeId: string | null;
};

export const INITIAL_DRAG_STATE: DragState = {
  activeId: null,
};

export const dragStateAtom = atom<DragState>(INITIAL_DRAG_STATE);

// Derived atom for granular subscriptions
export const activeIdAtom = atom((get) => get(dragStateAtom).activeId);
