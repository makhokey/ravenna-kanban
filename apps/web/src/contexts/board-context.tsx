import { createContext, use, type ReactNode } from "react";

interface BoardContextValue {
  boardSlug: string;
}

const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({
  boardSlug,
  children,
}: {
  boardSlug: string;
  children: ReactNode;
}) {
  return <BoardContext value={{ boardSlug }}>{children}</BoardContext>;
}

export function useBoardSlug(): string {
  const context = use(BoardContext);
  if (!context) {
    throw new Error("useBoardSlug must be used within a BoardProvider");
  }
  return context.boardSlug;
}
