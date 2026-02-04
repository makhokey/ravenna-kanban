import { describe, expect, it } from "vitest";
import {
  createCardServerSchema,
  updateCardServerSchema,
} from "~/lib/card-config";

describe("Card API Validation", () => {
  describe("createCardServerSchema", () => {
    it("validates a complete valid input", () => {
      const input = {
        title: "Test Card",
        description: "A description",
        boardId: "board-123",
        status: "todo",
        priority: "high",
        tags: ["bug", "feature"],
      };

      const result = createCardServerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Test Card");
        expect(result.data.priority).toBe("high");
        expect(result.data.tags).toEqual(["bug", "feature"]);
      }
    });

    it("validates minimal required fields", () => {
      const input = {
        title: "Minimal Card",
        boardId: "board-123",
      };

      const result = createCardServerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Minimal Card");
        expect(result.data.status).toBe("backlog"); // default
        expect(result.data.priority).toBe("none"); // default
      }
    });

    it("rejects empty title", () => {
      const input = {
        title: "",
        boardId: "board-123",
      };

      const result = createCardServerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects missing title", () => {
      const input = {
        boardId: "board-123",
      };

      const result = createCardServerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects missing boardId", () => {
      const input = {
        title: "Test Card",
      };

      const result = createCardServerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects invalid status", () => {
      const input = {
        title: "Test Card",
        boardId: "board-123",
        status: "invalid_status",
      };

      const result = createCardServerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects invalid priority", () => {
      const input = {
        title: "Test Card",
        boardId: "board-123",
        priority: "super_urgent",
      };

      const result = createCardServerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("accepts all valid status values", () => {
      const statuses = ["backlog", "todo", "in_progress", "review", "done"];

      for (const status of statuses) {
        const input = {
          title: "Test Card",
          boardId: "board-123",
          status,
        };

        const result = createCardServerSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it("accepts all valid priority values", () => {
      const priorities = ["none", "low", "medium", "high", "urgent"];

      for (const priority of priorities) {
        const input = {
          title: "Test Card",
          boardId: "board-123",
          priority,
        };

        const result = createCardServerSchema.safeParse(input);
        expect(result.success).toBe(true);
      }
    });

    it("accepts null tags", () => {
      const input = {
        title: "Test Card",
        boardId: "board-123",
        tags: null,
      };

      const result = createCardServerSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("accepts empty tags array", () => {
      const input = {
        title: "Test Card",
        boardId: "board-123",
        tags: [],
      };

      const result = createCardServerSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("updateCardServerSchema", () => {
    const validUuid = "550e8400-e29b-41d4-a716-446655440000";

    it("validates a complete update", () => {
      const input = {
        id: validUuid,
        title: "Updated Title",
        description: "Updated description",
        priority: "urgent",
        status: "in_progress",
        tags: ["bug"],
      };

      const result = updateCardServerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Updated Title");
        expect(result.data.priority).toBe("urgent");
      }
    });

    it("validates partial update with only id", () => {
      const input = {
        id: validUuid,
      };

      const result = updateCardServerSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("validates partial update with single field", () => {
      const input = {
        id: validUuid,
        title: "New Title Only",
      };

      const result = updateCardServerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("New Title Only");
        expect(result.data.description).toBeUndefined();
        expect(result.data.priority).toBeUndefined();
      }
    });

    it("rejects missing id", () => {
      const input = {
        title: "Updated Title",
      };

      const result = updateCardServerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects invalid uuid format", () => {
      const input = {
        id: "not-a-uuid",
        title: "Updated Title",
      };

      const result = updateCardServerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects empty title when provided", () => {
      const input = {
        id: validUuid,
        title: "",
      };

      const result = updateCardServerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects invalid status", () => {
      const input = {
        id: validUuid,
        status: "invalid",
      };

      const result = updateCardServerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects invalid priority", () => {
      const input = {
        id: validUuid,
        priority: "invalid",
      };

      const result = updateCardServerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("allows null tags to clear them", () => {
      const input = {
        id: validUuid,
        tags: null,
      };

      const result = updateCardServerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toBeNull();
      }
    });

    it("validates priority change only", () => {
      const input = {
        id: validUuid,
        priority: "high",
      };

      const result = updateCardServerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe("high");
        expect(result.data.title).toBeUndefined();
      }
    });

    it("validates status change only", () => {
      const input = {
        id: validUuid,
        status: "done",
      };

      const result = updateCardServerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe("done");
      }
    });
  });
});

describe("Card API Error Messages", () => {
  it("provides meaningful error for missing title", () => {
    const input = {
      boardId: "board-123",
    };

    const result = createCardServerSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      const titleError = result.error.issues.find((i) => i.path.includes("title"));
      expect(titleError).toBeDefined();
    }
  });

  it("provides meaningful error for invalid uuid", () => {
    const input = {
      id: "bad-id",
    };

    const result = updateCardServerSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain("Invalid");
    }
  });
});
