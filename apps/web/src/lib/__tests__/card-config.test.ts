import { describe, expect, it } from "vitest";
import {
  cardFormSchema,
  getPriorityOption,
  getSelectedTags,
  getStatusOption,
  PRIORITY_OPTIONS,
  safeParseJsonTags,
  STATUS_OPTIONS,
  TAG_OPTIONS,
} from "../card-config";

describe("Card Config Helpers", () => {
  describe("getStatusOption", () => {
    it("returns correct option for valid status", () => {
      const option = getStatusOption("todo");
      expect(option.value).toBe("todo");
      expect(option.label).toBe("Todo");
    });

    it("returns correct option for in_progress", () => {
      const option = getStatusOption("in_progress");
      expect(option.value).toBe("in_progress");
      expect(option.label).toBe("In Progress");
    });

    it("returns default (backlog) for null", () => {
      const option = getStatusOption(null);
      expect(option.value).toBe("backlog");
    });

    it("returns default (backlog) for undefined", () => {
      const option = getStatusOption(undefined);
      expect(option.value).toBe("backlog");
    });

    it("returns default for invalid status", () => {
      const option = getStatusOption("invalid");
      expect(option.value).toBe("backlog");
    });

    it("finds all valid statuses", () => {
      for (const status of STATUS_OPTIONS) {
        const option = getStatusOption(status.value);
        expect(option.value).toBe(status.value);
      }
    });
  });

  describe("getPriorityOption", () => {
    it("returns correct option for valid priority", () => {
      const option = getPriorityOption("high");
      expect(option.value).toBe("high");
      expect(option.label).toBe("High");
    });

    it("returns correct option for urgent", () => {
      const option = getPriorityOption("urgent");
      expect(option.value).toBe("urgent");
      expect(option.label).toBe("Urgent");
    });

    it("returns default (none) for invalid priority", () => {
      const option = getPriorityOption("invalid");
      expect(option.value).toBe("none");
    });

    it("finds all valid priorities", () => {
      for (const priority of PRIORITY_OPTIONS) {
        const option = getPriorityOption(priority.value);
        expect(option.value).toBe(priority.value);
      }
    });
  });

  describe("getSelectedTags", () => {
    it("returns matching tag options", () => {
      const tags = getSelectedTags(["bug", "feature"]);
      expect(tags).toHaveLength(2);
      expect(tags[0]?.value).toBe("bug");
      expect(tags[1]?.value).toBe("feature");
    });

    it("returns empty array for empty input", () => {
      const tags = getSelectedTags([]);
      expect(tags).toHaveLength(0);
    });

    it("filters out invalid tags", () => {
      const tags = getSelectedTags(["bug", "invalid", "feature"]);
      expect(tags).toHaveLength(2);
      expect(tags.map((t) => t.value)).toEqual(["bug", "feature"]);
    });

    it("returns empty for all invalid tags", () => {
      const tags = getSelectedTags(["invalid1", "invalid2"]);
      expect(tags).toHaveLength(0);
    });

    it("finds all valid tags", () => {
      const allTagValues = TAG_OPTIONS.map((t) => t.value);
      const tags = getSelectedTags(allTagValues);
      expect(tags).toHaveLength(TAG_OPTIONS.length);
    });
  });

  describe("safeParseJsonTags", () => {
    it("parses valid JSON array", () => {
      const tags = safeParseJsonTags('["bug", "feature"]');
      expect(tags).toEqual(["bug", "feature"]);
    });

    it("returns empty array for null", () => {
      const tags = safeParseJsonTags(null);
      expect(tags).toEqual([]);
    });

    it("returns empty array for undefined", () => {
      const tags = safeParseJsonTags(undefined);
      expect(tags).toEqual([]);
    });

    it("returns empty array for empty string", () => {
      const tags = safeParseJsonTags("");
      expect(tags).toEqual([]);
    });

    it("returns empty array for invalid JSON", () => {
      const tags = safeParseJsonTags("not valid json");
      expect(tags).toEqual([]);
    });

    it("returns empty array for JSON object (not array)", () => {
      const tags = safeParseJsonTags('{"key": "value"}');
      expect(tags).toEqual([]);
    });

    it("returns empty array for JSON string (not array)", () => {
      const tags = safeParseJsonTags('"just a string"');
      expect(tags).toEqual([]);
    });

    it("handles empty JSON array", () => {
      const tags = safeParseJsonTags("[]");
      expect(tags).toEqual([]);
    });
  });
});

describe("Card Form Schema", () => {
  describe("title validation", () => {
    it("accepts valid title", () => {
      const result = cardFormSchema.safeParse({
        title: "Valid Title",
      });
      expect(result.success).toBe(true);
    });

    it("trims whitespace from title", () => {
      const result = cardFormSchema.safeParse({
        title: "  Trimmed Title  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Trimmed Title");
      }
    });

    it("rejects empty title after trimming", () => {
      const result = cardFormSchema.safeParse({
        title: "   ",
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty title", () => {
      const result = cardFormSchema.safeParse({
        title: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("description validation", () => {
    it("accepts description", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
        description: "A description",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("A description");
      }
    });

    it("trims description whitespace", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
        description: "  Trimmed  ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe("Trimmed");
      }
    });

    it("converts empty description to undefined", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
        description: "",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });

    it("converts whitespace-only description to undefined", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
        description: "   ",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBeUndefined();
      }
    });
  });

  describe("priority validation", () => {
    it("defaults to none", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("none");
      }
    });

    it("accepts valid priority", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
        priority: "urgent",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("urgent");
      }
    });

    it("rejects invalid priority", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
        priority: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("status validation", () => {
    it("defaults to backlog", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("backlog");
      }
    });

    it("accepts valid status", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
        status: "in_progress",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("in_progress");
      }
    });

    it("rejects invalid status", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
        status: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("tags validation", () => {
    it("accepts tags array", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
        tags: ["bug", "feature"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual(["bug", "feature"]);
      }
    });

    it("transforms empty tags to null", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
        tags: [],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toBeNull();
      }
    });

    it("accepts undefined tags", () => {
      const result = cardFormSchema.safeParse({
        title: "Title",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toBeNull();
      }
    });
  });
});
