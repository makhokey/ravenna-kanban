import {
  COOKIE_MAX_AGE,
  COOKIE_NAME,
  DEFAULT_SETTINGS,
  parseCookies,
  type BoardSettings,
} from "./cookies.shared";

export function setBoardSettingsCookie(settings: Partial<BoardSettings>): void {
  if (typeof document === "undefined") return;

  const current = getBoardSettingsFromCookie();
  const merged = { ...current, ...settings };
  const value = encodeURIComponent(JSON.stringify(merged));

  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearBoardSettingsCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

function getBoardSettingsFromCookie(): BoardSettings {
  if (typeof document === "undefined") return DEFAULT_SETTINGS;

  const cookies = parseCookies(document.cookie);
  const settingsStr = cookies[COOKIE_NAME];

  if (!settingsStr) return DEFAULT_SETTINGS;

  try {
    const parsed = JSON.parse(decodeURIComponent(settingsStr));
    return {
      viewMode:
        parsed.viewMode === "kanban" || parsed.viewMode === "table"
          ? parsed.viewMode
          : DEFAULT_SETTINGS.viewMode,
      groupBy:
        parsed.groupBy === "status" || parsed.groupBy === "priority"
          ? parsed.groupBy
          : DEFAULT_SETTINGS.groupBy,
      priorityFilters: Array.isArray(parsed.priorityFilters)
        ? parsed.priorityFilters
        : DEFAULT_SETTINGS.priorityFilters,
      tagFilters: Array.isArray(parsed.tagFilters)
        ? parsed.tagFilters
        : DEFAULT_SETTINGS.tagFilters,
      sortField:
        parsed.sortField === "manual" ||
        parsed.sortField === "created" ||
        parsed.sortField === "updated"
          ? parsed.sortField
          : DEFAULT_SETTINGS.sortField,
      sortDirection:
        parsed.sortDirection === "asc" || parsed.sortDirection === "desc"
          ? parsed.sortDirection
          : DEFAULT_SETTINGS.sortDirection,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export {
  DEFAULT_SETTINGS,
  type BoardSettings,
  type SortDirection,
  type SortField,
  type ViewMode,
} from "./cookies.shared";
