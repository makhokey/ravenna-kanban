import type { CardData } from "./board-types";

export interface CardDragData {
  type: "card";
  card: CardData;
}

export function isCardDragData(data: unknown): data is CardDragData {
  return !!data && typeof data === "object" && "type" in data && data.type === "card";
}
