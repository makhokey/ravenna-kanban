import { describe, expect, it } from "vitest";
import {
  parseCookies,
  parseCookieSettings,
  DEFAULT_SETTINGS,
  COOKIE_NAME,
} from "../cookies.shared";

describe("parseCookies", () => {
  it("parses empty cookie header", () => {
    expect(parseCookies("")).toEqual({});
  });

  it("parses single cookie", () => {
    expect(parseCookies("name=value")).toEqual({ name: "value" });
  });

  it("parses multiple cookies", () => {
    expect(parseCookies("foo=bar; baz=qux")).toEqual({
      foo: "bar",
      baz: "qux",
    });
  });

  it("handles cookies with equals signs in value", () => {
    expect(parseCookies("encoded=a=b=c")).toEqual({ encoded: "a=b=c" });
  });

  it("handles whitespace around cookies", () => {
    expect(parseCookies("  foo=bar  ;  baz=qux  ")).toEqual({
      foo: "bar",
      baz: "qux",
    });
  });

  it("handles empty cookie names", () => {
    const result = parseCookies("=value; valid=yes");
    expect(result.valid).toBe("yes");
  });
});

describe("parseCookieSettings", () => {
  it("returns default settings when no cookie present", () => {
    expect(parseCookieSettings("")).toEqual(DEFAULT_SETTINGS);
  });

  it("returns default settings when cookie has wrong name", () => {
    const cookieHeader = "other-cookie=" + encodeURIComponent(JSON.stringify({ viewMode: "table" }));
    expect(parseCookieSettings(cookieHeader)).toEqual(DEFAULT_SETTINGS);
  });

  it("parses valid settings from cookie", () => {
    const settings = {
      viewMode: "table",
      groupBy: "priority",
      priorityFilters: ["high", "urgent"],
      tagFilters: ["bug"],
      sortField: "created",
      sortDirection: "asc",
      hiddenStatusColumns: ["done"],
      hiddenPriorityColumns: ["none"],
    };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}`;

    expect(parseCookieSettings(cookieHeader)).toEqual(settings);
  });

  it("falls back to defaults for invalid viewMode", () => {
    const settings = { viewMode: "invalid", groupBy: "status" };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}`;

    const result = parseCookieSettings(cookieHeader);
    expect(result.viewMode).toBe(DEFAULT_SETTINGS.viewMode);
    expect(result.groupBy).toBe("status");
  });

  it("falls back to defaults for invalid groupBy", () => {
    const settings = { viewMode: "kanban", groupBy: "invalid" };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}`;

    const result = parseCookieSettings(cookieHeader);
    expect(result.groupBy).toBe(DEFAULT_SETTINGS.groupBy);
  });

  it("falls back to defaults for invalid sortField", () => {
    const settings = { sortField: "invalid" };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}`;

    const result = parseCookieSettings(cookieHeader);
    expect(result.sortField).toBe(DEFAULT_SETTINGS.sortField);
  });

  it("falls back to defaults for invalid sortDirection", () => {
    const settings = { sortDirection: "invalid" };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}`;

    const result = parseCookieSettings(cookieHeader);
    expect(result.sortDirection).toBe(DEFAULT_SETTINGS.sortDirection);
  });

  it("falls back to defaults for non-array priorityFilters", () => {
    const settings = { priorityFilters: "high" };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}`;

    const result = parseCookieSettings(cookieHeader);
    expect(result.priorityFilters).toEqual(DEFAULT_SETTINGS.priorityFilters);
  });

  it("falls back to defaults for non-array tagFilters", () => {
    const settings = { tagFilters: "bug" };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}`;

    const result = parseCookieSettings(cookieHeader);
    expect(result.tagFilters).toEqual(DEFAULT_SETTINGS.tagFilters);
  });

  it("falls back to defaults for non-array hiddenStatusColumns", () => {
    const settings = { hiddenStatusColumns: "done" };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}`;

    const result = parseCookieSettings(cookieHeader);
    expect(result.hiddenStatusColumns).toEqual(DEFAULT_SETTINGS.hiddenStatusColumns);
  });

  it("falls back to defaults for non-array hiddenPriorityColumns", () => {
    const settings = { hiddenPriorityColumns: "none" };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}`;

    const result = parseCookieSettings(cookieHeader);
    expect(result.hiddenPriorityColumns).toEqual(DEFAULT_SETTINGS.hiddenPriorityColumns);
  });

  it("returns default settings for invalid JSON", () => {
    const cookieHeader = `${COOKIE_NAME}=not-valid-json`;
    expect(parseCookieSettings(cookieHeader)).toEqual(DEFAULT_SETTINGS);
  });

  it("returns default settings for malformed encoded value", () => {
    const cookieHeader = `${COOKIE_NAME}=%invalid%encoded`;
    expect(parseCookieSettings(cookieHeader)).toEqual(DEFAULT_SETTINGS);
  });

  it("preserves valid array values even when empty", () => {
    const settings = {
      viewMode: "kanban",
      groupBy: "status",
      priorityFilters: [],
      tagFilters: [],
      sortField: "manual",
      sortDirection: "desc",
      hiddenStatusColumns: [],
      hiddenPriorityColumns: [],
    };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}`;

    const result = parseCookieSettings(cookieHeader);
    expect(result).toEqual(settings);
  });

  it("handles partial settings by filling in defaults", () => {
    const settings = { viewMode: "table" };
    const cookieHeader = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(settings))}`;

    const result = parseCookieSettings(cookieHeader);
    expect(result.viewMode).toBe("table");
    expect(result.groupBy).toBe(DEFAULT_SETTINGS.groupBy);
    expect(result.priorityFilters).toEqual(DEFAULT_SETTINGS.priorityFilters);
  });
});
