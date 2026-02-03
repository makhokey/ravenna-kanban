import { atom } from "jotai";
import type { CardData } from "~/types/board";

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

export const activeCardAtom = atom<CardData | null>(null);
export const tempCardOrderAtom = atom<Record<string, string[]> | null>(null);

export const activeCardIdAtom = atom((get) => get(activeCardAtom)?.id ?? null);
export const activeColumnIdAtom = atom((get) => get(activeCardAtom)?.columnId ?? null);

