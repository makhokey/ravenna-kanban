import type { GroupBy } from "~/types/board-types";

export type ViewMode = "kanban" | "table";
export type SortField = "manual" | "created" | "updated";
export type SortDirection = "asc" | "desc";

export type BoardSettings = {
  viewMode: ViewMode;
  groupBy: GroupBy;
  priorityFilters: string[];
  tagFilters: string[];
  sortField: SortField;
  sortDirection: SortDirection;
  hiddenStatusColumns: string[];
  hiddenPriorityColumns: string[];
};

export const DEFAULT_SETTINGS: BoardSettings = {
  viewMode: "kanban",
  groupBy: "status",
  priorityFilters: [],
  tagFilters: [],
  sortField: "manual",
  sortDirection: "desc",
  hiddenStatusColumns: [],
  hiddenPriorityColumns: [],
};

export const COOKIE_NAME = "board-settings";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  for (const cookie of cookieHeader.split(";")) {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) {
      cookies[name] = rest.join("=");
    }
  }
  return cookies;
}

function isValidViewMode(value: unknown): value is ViewMode {
  return value === "kanban" || value === "table";
}

function isValidGroupBy(value: unknown): value is GroupBy {
  return value === "status" || value === "priority";
}

function isValidSortField(value: unknown): value is SortField {
  return value === "manual" || value === "created" || value === "updated";
}

function isValidSortDirection(value: unknown): value is SortDirection {
  return value === "asc" || value === "desc";
}

export function parseCookieSettings(cookieHeader: string): BoardSettings {
  const cookies = parseCookies(cookieHeader);
  const settingsStr = cookies[COOKIE_NAME];

  if (!settingsStr) {
    return DEFAULT_SETTINGS;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(settingsStr));
    return {
      viewMode: isValidViewMode(parsed.viewMode) ? parsed.viewMode : DEFAULT_SETTINGS.viewMode,
      groupBy: isValidGroupBy(parsed.groupBy) ? parsed.groupBy : DEFAULT_SETTINGS.groupBy,
      priorityFilters: Array.isArray(parsed.priorityFilters)
        ? parsed.priorityFilters
        : DEFAULT_SETTINGS.priorityFilters,
      tagFilters: Array.isArray(parsed.tagFilters)
        ? parsed.tagFilters
        : DEFAULT_SETTINGS.tagFilters,
      sortField: isValidSortField(parsed.sortField)
        ? parsed.sortField
        : DEFAULT_SETTINGS.sortField,
      sortDirection: isValidSortDirection(parsed.sortDirection)
        ? parsed.sortDirection
        : DEFAULT_SETTINGS.sortDirection,
      hiddenStatusColumns: Array.isArray(parsed.hiddenStatusColumns)
        ? parsed.hiddenStatusColumns
        : DEFAULT_SETTINGS.hiddenStatusColumns,
      hiddenPriorityColumns: Array.isArray(parsed.hiddenPriorityColumns)
        ? parsed.hiddenPriorityColumns
        : DEFAULT_SETTINGS.hiddenPriorityColumns,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
