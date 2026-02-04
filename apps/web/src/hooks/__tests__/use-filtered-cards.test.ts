import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFilteredCardIds, useFilteredCards } from "../use-filtered-cards";

// Test card factory
function createCard(
  overrides: Partial<{
    id: string;
    priority: string;
    tags: string | null;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
) {
  return {
    id: overrides.id ?? "card-1",
    priority: overrides.priority ?? "none",
    tags: overrides.tags ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01"),
  };
}

describe("useFilteredCards", () => {
  describe("priority filtering", () => {
    it("returns all cards when no filters applied", () => {
      const cards = [
        createCard({ id: "1", priority: "high" }),
        createCard({ id: "2", priority: "low" }),
        createCard({ id: "3", priority: "none" }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(), new Set(), "manual", "desc"),
      );

      expect(result.current).toHaveLength(3);
    });

    it("filters cards by single priority", () => {
      const cards = [
        createCard({ id: "1", priority: "high" }),
        createCard({ id: "2", priority: "low" }),
        createCard({ id: "3", priority: "none" }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(["high"]), new Set(), "manual", "desc"),
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe("1");
    });

    it("filters cards by multiple priorities", () => {
      const cards = [
        createCard({ id: "1", priority: "high" }),
        createCard({ id: "2", priority: "low" }),
        createCard({ id: "3", priority: "none" }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(["high", "low"]), new Set(), "manual", "desc"),
      );

      expect(result.current).toHaveLength(2);
      expect(result.current.map((c) => c.id)).toEqual(["1", "2"]);
    });
  });

  describe("tag filtering", () => {
    it("filters cards by single tag", () => {
      const cards = [
        createCard({ id: "1", tags: JSON.stringify(["bug"]) }),
        createCard({ id: "2", tags: JSON.stringify(["feature"]) }),
        createCard({ id: "3", tags: null }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(), new Set(["bug"]), "manual", "desc"),
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe("1");
    });

    it("filters cards by multiple tags (OR logic)", () => {
      const cards = [
        createCard({ id: "1", tags: JSON.stringify(["bug"]) }),
        createCard({ id: "2", tags: JSON.stringify(["feature"]) }),
        createCard({ id: "3", tags: JSON.stringify(["documentation"]) }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(), new Set(["bug", "feature"]), "manual", "desc"),
      );

      expect(result.current).toHaveLength(2);
      expect(result.current.map((c) => c.id)).toEqual(["1", "2"]);
    });

    it("matches cards with any of multiple tags", () => {
      const cards = [
        createCard({ id: "1", tags: JSON.stringify(["bug", "feature"]) }),
        createCard({ id: "2", tags: JSON.stringify(["documentation"]) }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(), new Set(["bug"]), "manual", "desc"),
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe("1");
    });
  });

  describe("combined filters", () => {
    it("applies both priority and tag filters (AND logic)", () => {
      const cards = [
        createCard({ id: "1", priority: "high", tags: JSON.stringify(["bug"]) }),
        createCard({ id: "2", priority: "high", tags: JSON.stringify(["feature"]) }),
        createCard({ id: "3", priority: "low", tags: JSON.stringify(["bug"]) }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(["high"]), new Set(["bug"]), "manual", "desc"),
      );

      expect(result.current).toHaveLength(1);
      expect(result.current[0].id).toBe("1");
    });
  });

  describe("sorting", () => {
    it("preserves original order for manual sort", () => {
      const cards = [
        createCard({ id: "1", createdAt: new Date("2024-03-01") }),
        createCard({ id: "2", createdAt: new Date("2024-01-01") }),
        createCard({ id: "3", createdAt: new Date("2024-02-01") }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(), new Set(), "manual", "desc"),
      );

      expect(result.current.map((c) => c.id)).toEqual(["1", "2", "3"]);
    });

    it("sorts by created date ascending", () => {
      const cards = [
        createCard({ id: "1", createdAt: new Date("2024-03-01") }),
        createCard({ id: "2", createdAt: new Date("2024-01-01") }),
        createCard({ id: "3", createdAt: new Date("2024-02-01") }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(), new Set(), "created", "asc"),
      );

      expect(result.current.map((c) => c.id)).toEqual(["2", "3", "1"]);
    });

    it("sorts by created date descending", () => {
      const cards = [
        createCard({ id: "1", createdAt: new Date("2024-03-01") }),
        createCard({ id: "2", createdAt: new Date("2024-01-01") }),
        createCard({ id: "3", createdAt: new Date("2024-02-01") }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(), new Set(), "created", "desc"),
      );

      expect(result.current.map((c) => c.id)).toEqual(["1", "3", "2"]);
    });

    it("sorts by updated date ascending", () => {
      const cards = [
        createCard({ id: "1", updatedAt: new Date("2024-03-01") }),
        createCard({ id: "2", updatedAt: new Date("2024-01-01") }),
        createCard({ id: "3", updatedAt: new Date("2024-02-01") }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(), new Set(), "updated", "asc"),
      );

      expect(result.current.map((c) => c.id)).toEqual(["2", "3", "1"]);
    });

    it("sorts by updated date descending", () => {
      const cards = [
        createCard({ id: "1", updatedAt: new Date("2024-03-01") }),
        createCard({ id: "2", updatedAt: new Date("2024-01-01") }),
        createCard({ id: "3", updatedAt: new Date("2024-02-01") }),
      ];

      const { result } = renderHook(() =>
        useFilteredCards(cards, new Set(), new Set(), "updated", "desc"),
      );

      expect(result.current.map((c) => c.id)).toEqual(["1", "3", "2"]);
    });
  });
});

describe("useFilteredCardIds", () => {
  it("filters and sorts card IDs using cardsById lookup", () => {
    const cardIds = ["1", "2", "3"];
    const cardsById = {
      "1": createCard({ id: "1", priority: "high", createdAt: new Date("2024-03-01") }),
      "2": createCard({ id: "2", priority: "low", createdAt: new Date("2024-01-01") }),
      "3": createCard({ id: "3", priority: "high", createdAt: new Date("2024-02-01") }),
    };

    const { result } = renderHook(() =>
      useFilteredCardIds(
        cardIds,
        cardsById,
        new Set(["high"]),
        new Set(),
        "created",
        "asc",
      ),
    );

    expect(result.current).toEqual(["3", "1"]);
  });

  it("handles missing cards in cardsById gracefully", () => {
    const cardIds = ["1", "missing", "3"];
    const cardsById = {
      "1": createCard({ id: "1", priority: "high" }),
      "3": createCard({ id: "3", priority: "high" }),
    };

    const { result } = renderHook(() =>
      useFilteredCardIds(
        cardIds,
        cardsById,
        new Set(["high"]),
        new Set(),
        "manual",
        "desc",
      ),
    );

    // "missing" should be filtered out since it doesn't exist
    expect(result.current).toEqual(["1", "3"]);
  });
});
