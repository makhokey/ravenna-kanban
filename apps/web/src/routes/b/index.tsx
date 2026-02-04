import { createFileRoute, redirect } from "@tanstack/react-router";
import { getFirstBoardSlug } from "~/api/board-api";

export const Route = createFileRoute("/b/")({
  beforeLoad: async () => {
    const boardSlug = await getFirstBoardSlug();

    if (boardSlug) {
      throw redirect({ to: "/b/$boardSlug", params: { boardSlug } });
    } else {
      throw redirect({ to: "/b/setup" });
    }
  },
});
