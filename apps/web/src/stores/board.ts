import { atom } from "jotai";

// View mode
export type ViewMode = "kanban" | "table";
export const viewModeAtom = atom<ViewMode>("kanban");

// Filters - empty set means "show all"
export const priorityFiltersAtom = atom<Set<string>>(new Set<string>());
export const tagFiltersAtom = atom<Set<string>>(new Set<string>());

// Dialog state (shared between views)
export const dialogAtom = atom<{
  open: boolean;
  mode: "create" | "edit";
  cardId?: string;
  columnId?: string;
}>({ open: false, mode: "create" });

// Side panel state for card editing
export const panelAtom = atom<{
  open: boolean;
  mode: "create" | "edit";
  cardId?: string;
  columnId?: string;
}>({ open: false, mode: "create" });
