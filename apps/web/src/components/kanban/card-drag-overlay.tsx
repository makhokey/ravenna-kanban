import {
  defaultDropAnimationSideEffects,
  DragOverlay,
  type DropAnimation,
} from "@dnd-kit/core";
import { useAtomValue } from "jotai";
import { createPortal } from "react-dom";
import { activeCardAtom } from "~/stores/kanban-drag";
import { Card } from "./card";

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.5",
      },
    },
  }),
};

export function CardDragOverlay() {
  const activeCard = useAtomValue(activeCardAtom);

  if (typeof document === "undefined") return null;

  return createPortal(
    <DragOverlay dropAnimation={dropAnimation}>
      {activeCard && <Card card={activeCard} dragOverlay dragging />}
    </DragOverlay>,
    document.body,
  );
}
