import { atom } from "jotai";

// View mode
export type ViewMode = "kanban" | "table";
export const viewModeAtom = atom<ViewMode>("kanban");

// Filters - empty set means "show all"
export const priorityFiltersAtom = atom<Set<string>>(new Set<string>());
export const tagFiltersAtom = atom<Set<string>>(new Set<string>());

// Shared type for card editor state (dialog and panel)
export type CardEditorState = {
  open: boolean;
  mode: "create" | "edit";
  cardId?: string;
  columnId?: string;
};

const initialEditorState: CardEditorState = { open: false, mode: "create" };

// Dialog state (modal for creating/editing cards)
export const dialogAtom = atom<CardEditorState>(initialEditorState);

// Side panel state for card editing
export const panelAtom = atom<CardEditorState>(initialEditorState);
