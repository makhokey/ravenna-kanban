import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Popover, PopoverPopup, PopoverTrigger } from "@repo/ui/components/popover";
import { Toggle, ToggleGroup } from "@repo/ui/components/toggle-group";
import { cn } from "@repo/ui/lib/utils";
import { useAtom } from "jotai";
import { FilterIcon, LayoutGrid, List, SlidersHorizontalIcon, X } from "lucide-react";
import { PRIORITY_OPTIONS, TAG_OPTIONS } from "~/components/shared/card-schema";
import {
  priorityFiltersAtom,
  tagFiltersAtom,
  viewModeAtom,
  type ViewMode,
} from "~/atoms/board";
import { ThemeToggle } from "~/components/theme-toggle";

export function FilterBar() {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [priorityFilters, setPriorityFilters] = useAtom(priorityFiltersAtom);
  const [tagFilters, setTagFilters] = useAtom(tagFiltersAtom);

  const togglePriority = (value: string) => {
    setPriorityFilters((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const toggleTag = (value: string) => {
    setTagFilters((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setPriorityFilters(new Set<string>());
    setTagFilters(new Set<string>());
  };

  const hasFilters = priorityFilters.size > 0 || tagFilters.size > 0;

  return (
    <div className="flex justify-between items-center gap-4 border-b px-4 py-1.5">
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm">
              <FilterIcon className="size-3" />
              Filters
            </Button>
          }
        />
        <PopoverPopup align="start" className="w-92 flex-col gap-2" >
       Priority
        {PRIORITY_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={priorityFilters.has(option.value) ? "default" : "outline"}
            size="sm"
            onClick={() => togglePriority(option.value)}
            className="h-7 px-2 text-xs"
          >
            <option.icon className="mr-1 size-3" />
            {option.label}
          </Button>
        ))}
        Tags
        {TAG_OPTIONS.map((option) => (
          <Badge
            key={option.value}
            variant={tagFilters.has(option.value) ? "default" : "outline"}
            className={cn(
              "cursor-pointer capitalize",
              tagFilters.has(option.value) && "border-transparent",
            )}
            onClick={() => toggleTag(option.value)}
          >
            <span className={cn("size-2 rounded-full", option.color)} />
            {option.label}
          </Badge>
        ))}


      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
        >
          <X className="mr-1 size-3" />
          Clear
        </Button>
      )}

        </PopoverPopup>
      </Popover>

      <ThemeToggle />
    

      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm">
              <SlidersHorizontalIcon className="size-3" />
              Display
            </Button>
          }
        />
        <PopoverPopup align="end" className="w-48">
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-medium">View</span>
            <ToggleGroup
              value={[viewMode]}
              onValueChange={(value) => {
                const newValue = value[0] as ViewMode | undefined;
                if (newValue) setViewMode(newValue);
              }}
              variant="outline"
              className="w-full"
            >
              <Toggle value="kanban" className="flex-1 p-2">
                <LayoutGrid className="size-4" />
                Kanban
              </Toggle>
              <Toggle value="table" className="flex-1 p-2">
                <List className="size-4" />
                Table
              </Toggle>
            </ToggleGroup>
          </div>
        </PopoverPopup>
      </Popover>
    </div>
  );
}
