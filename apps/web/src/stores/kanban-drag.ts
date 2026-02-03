import { atom } from "jotai";
import type { CardData } from "~/types/board";
export const activeCardAtom = atom<CardData | null>(null);
export const tempCardOrderAtom = atom<Record<string, string[]> | null>(null);

// Derived atoms for granular subscriptions
export const activeCardIdAtom = atom((get) => get(activeCardAtom)?.id ?? null);
export const activeColumnIdAtom = atom((get) => get(activeCardAtom)?.columnId ?? null);
