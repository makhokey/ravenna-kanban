import { atom } from "jotai";
import type { CardData, GroupBy, StatusValue } from "~/types/board-types";

// View mode
export type ViewMode = "kanban" | "table";
export const viewModeAtom = atom<ViewMode>("kanban");

// Group by mode (status or priority)
export const groupByAtom = atom<GroupBy>("status");

// Filters - empty set means "show all"
export const priorityFiltersAtom = atom<Set<string>>(new Set<string>());
export const tagFiltersAtom = atom<Set<string>>(new Set<string>());

// Shared type for card editor state (dialog and panel)
export type CardEditorState = {
  open: boolean;
  mode: "create" | "edit";
  cardId?: string;
  status?: StatusValue;
};

const initialEditorState: CardEditorState = { open: false, mode: "create" };

// Dialog state (modal for creating/editing cards)
export const dialogAtom = atom<CardEditorState>(initialEditorState);

// Side panel state for card editing
export const panelAtom = atom<CardEditorState>(initialEditorState);

export const selectedCardIdAtom = atom((get) => {
  const panel = get(panelAtom);
  return panel.open ? panel.cardId : null;
});

export const activeCardAtom = atom<CardData | null>(null);
export const tempCardOrderAtom = atom<Record<string, string[]> | null>(null);

export const activeCardIdAtom = atom((get) => get(activeCardAtom)?.id ?? null);

// Get the active card's group key based on current groupBy mode
export const activeGroupKeyAtom = atom((get) => {
  const card = get(activeCardAtom);
  const groupBy = get(groupByAtom);
  if (!card) return null;
  return groupBy === "status" ? card.status : card.priority || "none";
});
