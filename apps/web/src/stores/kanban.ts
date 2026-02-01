import { atom } from "jotai";

export const dialogAtom = atom<{
  open: boolean;
  mode: "create" | "edit";
  cardId?: string;
  columnId?: string;
}>({ open: false, mode: "create" });

export const dragStateAtom = atom<{
  activeId: string | null;
  type: "card" | null;
}>({ activeId: null, type: null });
