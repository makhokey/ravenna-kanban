import { keepPreviousData, queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getBoard } from "~/api/board-api";
import { useBoardSlug } from "~/contexts/board-context";
import { boardKeys } from "./query-keys";

export const boardQueryOptions = (slug: string) =>
  queryOptions({
    queryKey: boardKeys.detail(slug),
    queryFn: async () => {
      const board = await getBoard({ data: { slug } });
      if (!board) {
        throw new Error("Board not found");
      }
      return board;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    placeholderData: keepPreviousData, // Smooth transitions
  });

export function useBoard() {
  const boardSlug = useBoardSlug();
  return useSuspenseQuery(boardQueryOptions(boardSlug));
}

// Export for use in mutations
export type BoardData = NonNullable<Awaited<ReturnType<typeof getBoard>>>;
