import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Popover, PopoverPopup, PopoverTrigger } from "@repo/ui/components/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Toggle, ToggleGroup } from "@repo/ui/components/toggle-group";
import { cn } from "@repo/ui/lib/utils";
import { useAtom } from "jotai";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  FilterIcon,
  Layers,
  LayoutGrid,
  List,
  RotateCcw,
  Signal,
  SlidersHorizontalIcon,
  X,
} from "lucide-react";
import {
  groupByAtom,
  hiddenPriorityColumnsAtom,
  hiddenStatusColumnsAtom,
  priorityFiltersAtom,
  sortDirectionAtom,
  sortFieldAtom,
  tagFiltersAtom,
  viewModeAtom,
  type SortDirection,
  type SortField,
  type ViewMode,
} from "~/atoms/board-atoms";
import { PRIORITY_OPTIONS, STATUS_OPTIONS, TAG_OPTIONS } from "~/lib/card-config";
import { clearBoardSettingsCookie, setBoardSettingsCookie } from "~/lib/cookies.client";
import type { GroupBy } from "~/types/board-types";
import { ThemeToggle } from "./theme-toggle";

const SORT_OPTIONS = [
  { label: "Manual", value: "manual" },
  { label: "Created", value: "created" },
  { label: "Updated", value: "updated" },
] as const;

export function BoardFilter() {
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [groupBy, setGroupBy] = useAtom(groupByAtom);
  const [priorityFilters, setPriorityFilters] = useAtom(priorityFiltersAtom);
  const [tagFilters, setTagFilters] = useAtom(tagFiltersAtom);
  const [sortField, setSortField] = useAtom(sortFieldAtom);
  const [sortDirection, setSortDirection] = useAtom(sortDirectionAtom);
  const [hiddenStatusColumns, setHiddenStatusColumns] = useAtom(hiddenStatusColumnsAtom);
  const [hiddenPriorityColumns, setHiddenPriorityColumns] = useAtom(hiddenPriorityColumnsAtom);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setBoardSettingsCookie({ viewMode: mode });
  };

  const handleGroupByChange = (group: GroupBy) => {
    setGroupBy(group);
    setBoardSettingsCookie({ groupBy: group });
  };

  const handleSortFieldChange = (field: SortField) => {
    setSortField(field);
    setBoardSettingsCookie({ sortField: field });
  };

  const toggleSortDirection = () => {
    const newDir: SortDirection = sortDirection === "asc" ? "desc" : "asc";
    setSortDirection(newDir);
    setBoardSettingsCookie({ sortDirection: newDir });
  };

  const togglePriority = (value: string) => {
    setPriorityFilters((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      setBoardSettingsCookie({ priorityFilters: [...next] });
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
      setBoardSettingsCookie({ tagFilters: [...next] });
      return next;
    });
  };

  const clearFilters = () => {
    setPriorityFilters(new Set<string>());
    setTagFilters(new Set<string>());
    setBoardSettingsCookie({ priorityFilters: [], tagFilters: [] });
  };

  const toggleHiddenStatusColumn = (value: string) => {
    setHiddenStatusColumns((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      setBoardSettingsCookie({ hiddenStatusColumns: [...next] });
      return next;
    });
  };

  const toggleHiddenPriorityColumn = (value: string) => {
    setHiddenPriorityColumns((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      setBoardSettingsCookie({ hiddenPriorityColumns: [...next] });
      return next;
    });
  };

  const hasFilters = priorityFilters.size > 0 || tagFilters.size > 0;
  const hasHiddenColumns = hiddenStatusColumns.size > 0 || hiddenPriorityColumns.size > 0;

  const hasNonDefaultSettings =
    hasFilters ||
    hasHiddenColumns ||
    viewMode !== "kanban" ||
    groupBy !== "status" ||
    sortField !== "manual" ||
    sortDirection !== "desc";

  const resetToDefaults = () => {
    setViewMode("kanban");
    setGroupBy("status");
    setPriorityFilters(new Set<string>());
    setTagFilters(new Set<string>());
    setSortField("manual");
    setSortDirection("desc");
    setHiddenStatusColumns(new Set<string>());
    setHiddenPriorityColumns(new Set<string>());
    clearBoardSettingsCookie();
  };

  return (
    <div className="flex items-center justify-between gap-4 border-b px-4 py-1.5">
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="sm">
              <FilterIcon className="size-3" />
              Filters
            </Button>
          }
        />
        <PopoverPopup align="start" className="w-92 flex-col gap-2">
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
            <Button variant="ghost" size="sm" onClick={clearFilters}>
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
        <PopoverPopup align="end" className="w-82">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium">View</span>
              <ToggleGroup
                value={[viewMode]}
                onValueChange={(value) => {
                  const newValue = value[0] as ViewMode | undefined;
                  if (newValue) handleViewModeChange(newValue);
                }}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Toggle value="kanban" className="flex-1 p-2">
                  <LayoutGrid className="size-3" />
                  Kanban
                </Toggle>
                <Toggle value="table" className="flex-1 p-2">
                  <List className="size-3" />
                  Table
                </Toggle>
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium">Group By</span>
              <ToggleGroup
                value={[groupBy]}
                onValueChange={(value) => {
                  const newValue = value[0] as GroupBy | undefined;
                  if (newValue) handleGroupByChange(newValue);
                }}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Toggle value="status" className="flex-1 p-2">
                  <Layers className="size-3" />
                  Status
                </Toggle>
                <Toggle value="priority" className="flex-1 p-2">
                  <Signal className="size-3" />
                  Priority
                </Toggle>
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium">Ordering</span>
              <div className="flex items-center gap-2">
                <Select
                  value={sortField}
                  onValueChange={(value) => value && handleSortFieldChange(value)}
                  items={SORT_OPTIONS}
                >
                  <SelectTrigger size="sm" className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sortField !== "manual" && (
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={toggleSortDirection}
                    aria-label={sortDirection === "asc" ? "Sort ascending" : "Sort descending"}
                  >
                    {sortDirection === "asc" ? (
                      <ArrowUpNarrowWide className="size-4" />
                    ) : (
                      <ArrowDownWideNarrow className="size-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground text-xs font-medium">Columns</span>
              <div className="flex flex-wrap gap-1">
                {groupBy === "status"
                  ? STATUS_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={hiddenStatusColumns.has(opt.value) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleHiddenStatusColumn(opt.value)}
                        className="h-7 px-2 text-xs"
                      >
                        <opt.icon className="mr-1 size-3" />
                        {opt.label}
                      </Button>
                    ))
                  : PRIORITY_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={hiddenPriorityColumns.has(opt.value) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => toggleHiddenPriorityColumn(opt.value)}
                        className="h-7 px-2 text-xs"
                      >
                        <opt.icon className="mr-1 size-3" />
                        {opt.label}
                      </Button>
                    ))}
              </div>
            </div>

            {hasNonDefaultSettings && (
              <Button variant="ghost" size="sm" onClick={resetToDefaults} className="w-full">
                <RotateCcw className="size-3" />
                Reset
              </Button>
            )}
          </div>
        </PopoverPopup>
      </Popover>
    </div>
  );
}
