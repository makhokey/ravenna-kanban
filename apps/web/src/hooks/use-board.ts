import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getFirstBoard } from "~/server/boards";

export const boardQueryOptions = queryOptions({
  queryKey: ["board"],
  queryFn: () => getFirstBoard({}),
});

export function useBoard() {
  return useSuspenseQuery(boardQueryOptions);
}
