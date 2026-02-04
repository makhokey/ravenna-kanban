import { keepPreviousData, queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getFirstBoard } from "~/api/board-api";
import { boardKeys } from "./query-keys";

// Default board ID for single-board mode
// In multi-board mode, this would come from route params
export const DEFAULT_BOARD_ID = "default";

export const boardQueryOptions = queryOptions({
  queryKey: boardKeys.detail(DEFAULT_BOARD_ID),
  queryFn: async () => {
    const board = await getFirstBoard({});
    if (!board) {
      throw new Error("No board found");
    }
    return board;
  },
  staleTime: 2 * 60 * 1000, // 2 minutes - data considered fresh
  gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
  placeholderData: keepPreviousData, // Smooth transitions
});

export function useBoard() {
  return useSuspenseQuery(boardQueryOptions);
}

// Export for use in mutations
export type BoardData = NonNullable<Awaited<ReturnType<typeof getFirstBoard>>>;
