import { Button } from "@repo/ui/components/button";
import { Popover, PopoverPopup, PopoverTrigger } from "@repo/ui/components/popover";
import { Separator } from "@repo/ui/components/separator";
import { toastManager } from "@repo/ui/components/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Plus, Settings2, Trash2 } from "lucide-react";
import {
  clearBoardCards,
  deleteBoard,
  generateSeedData,
  listBoards,
} from "~/api/admin-api";
import { useBoardSlug } from "~/contexts/board-context";

export function AdminPopover() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const boardSlug = useBoardSlug();

  // Query for boards list to find current board by slug
  const { data: boardsList = [] } = useQuery({
    queryKey: ["boards", "list"],
    queryFn: () => listBoards(),
  });

  const currentBoard = boardsList.find((b) => b.slug === boardSlug);

  // Clear cards mutation
  const clearCardsMutation = useMutation({
    mutationFn: (boardId: string) => clearBoardCards({ data: { boardId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", boardSlug] });
      toastManager.add({
        title: "Cards cleared",
        description: "All cards have been removed from this board.",
        type: "success",
      });
    },
    onError: (error) => {
      toastManager.add({
        title: "Error clearing cards",
        description: error.message,
        type: "error",
      });
    },
  });

  // Generate seed data mutation (50 cards)
  const generateMutation = useMutation({
    mutationFn: (boardId: string) =>
      generateSeedData({ data: { boardId, count: 50, clearExisting: false } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["boards", boardSlug] });
      toastManager.add({
        title: "Cards added",
        description: `${data.count} random cards have been added.`,
        type: "success",
      });
    },
    onError: (error) => {
      console.error("generateSeedData error:", error);
      toastManager.add({
        title: "Error adding cards",
        description: error.message,
        type: "error",
      });
    },
  });

  // Delete board mutation
  const deleteBoardMutation = useMutation({
    mutationFn: (boardId: string) => deleteBoard({ data: { boardId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", "list"] });
      toastManager.add({
        title: "Board deleted",
        description: "The board has been permanently deleted.",
        type: "success",
      });
      navigate({ to: "/" });
    },
    onError: (error) => {
      toastManager.add({
        title: "Error deleting board",
        description: error.message,
        type: "error",
      });
    },
  });

  const handleClearCards = () => {
    if (currentBoard) {
      clearCardsMutation.mutate(currentBoard.id);
    }
  };

  const handleAddCards = () => {
    console.log("handleAddCards clicked", { currentBoard, boardSlug });
    if (currentBoard) {
      generateMutation.mutate(currentBoard.id);
    }
  };

  const handleDeleteBoard = () => {
    if (currentBoard) {
      deleteBoardMutation.mutate(currentBoard.id);
    }
  };

  const isLoading =
    clearCardsMutation.isPending ||
    generateMutation.isPending ||
    deleteBoardMutation.isPending;

  if (!currentBoard) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Popover>
        <PopoverTrigger
          render={
            <Button size="icon" className="size-10 rounded-full shadow-lg">
              <Settings2 className="size-5" />
            </Button>
          }
        />
        <PopoverPopup side="top" align="start" className="w-64" sideOffset={10}>
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              {currentBoard.name}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddCards}
              disabled={isLoading}
              className="w-full justify-start"
            >
              {generateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Add 50 random cards
            </Button>

            <Separator />

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCards}
              disabled={isLoading}
              className="text-destructive hover:text-destructive w-full justify-start"
            >
              {clearCardsMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Clear all cards
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteBoard}
              disabled={isLoading}
              className="text-destructive hover:text-destructive w-full justify-start"
            >
              {deleteBoardMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete board
            </Button>
          </div>
        </PopoverPopup>
      </Popover>
    </div>
  );
}
