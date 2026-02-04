import { getRequest } from "@tanstack/react-start/server";
import { parseCookieSettings, type BoardSettings } from "./cookies.shared";

export function getBoardSettingsFromRequest(): BoardSettings {
  const request = getRequest();
  const cookieHeader = request?.headers.get("cookie") ?? "";
  return parseCookieSettings(cookieHeader);
}

export { DEFAULT_SETTINGS, type BoardSettings, type ViewMode } from "./cookies.shared";
