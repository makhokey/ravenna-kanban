import { boards, cards } from "@repo/db/schema";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, isNull } from "drizzle-orm";
import { generateKeyBetween } from "fractional-indexing";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "~/lib/db";
import { generatePrefix } from "~/lib/prefix";
import { invalidateBoardCache } from "./cache-utils";

// Pool of realistic task titles
const TITLES = [
  "Implement user authentication",
  "Fix pagination bug",
  "Add dark mode support",
  "Optimize database queries",
  "Create API documentation",
  "Refactor error handling",
  "Add unit tests for utils",
  "Implement search functionality",
  "Fix mobile responsive layout",
  "Add export to CSV feature",
  "Improve loading performance",
  "Update dependencies",
  "Add input validation",
  "Fix memory leak issue",
  "Implement caching layer",
  "Add keyboard shortcuts",
  "Fix date formatting bug",
  "Create onboarding flow",
  "Add notification system",
  "Implement file upload",
  "Fix cross-browser issues",
  "Add analytics tracking",
  "Refactor state management",
  "Implement drag and drop",
  "Add undo/redo functionality",
  "Fix race condition bug",
  "Create user settings page",
  "Add email notifications",
  "Implement bulk actions",
  "Fix sorting algorithm",
  "Add filter by date range",
  "Create admin dashboard",
  "Implement rate limiting",
  "Add two-factor auth",
  "Fix session timeout issue",
  "Create backup system",
  "Add audit logging",
  "Implement webhooks",
  "Fix data sync issues",
  "Add batch processing",
  "Create API versioning",
  "Implement retry logic",
  "Add health check endpoint",
  "Fix timezone handling",
  "Create migration script",
  "Add data export feature",
  "Implement soft delete",
  "Fix duplicate entries bug",
  "Add column reordering",
  "Create card templates",
  "Implement card linking",
  "Add time tracking",
  "Fix attachment preview",
  "Create activity feed",
  "Add mentions support",
  "Implement card archiving",
  "Fix filter persistence",
  "Add board templates",
  "Create import wizard",
  "Implement card cloning",
  "Set up CI/CD pipeline",
  "Write integration tests",
  "Add loading skeletons",
  "Fix z-index stacking",
  "Implement infinite scroll",
  "Add offline support",
  "Fix animation jank",
  "Create error boundaries",
  "Add progress indicators",
  "Implement lazy loading",
  "Fix form validation",
  "Add confirmation dialogs",
  "Create toast notifications",
  "Implement dark theme",
  "Fix hover states",
  "Add keyboard navigation",
  "Create empty states",
  "Implement search filters",
  "Fix scroll behavior",
  "Add drag handles",
  "Create context menus",
  "Implement shortcuts modal",
  "Fix focus management",
  "Add batch selection",
  "Create print styles",
  "Implement data sync",
  "Fix cache invalidation",
  "Add optimistic updates",
  "Create loading states",
  "Implement error recovery",
  "Fix memory usage",
  "Add performance monitoring",
  "Create debug tools",
  "Implement feature flags",
  "Fix accessibility issues",
  "Add screen reader support",
  "Create keyboard hints",
  "Implement focus trapping",
  "Fix color contrast",
  "Add ARIA labels",
  "Create skip links",
];

// Pool of descriptions
const DESCRIPTIONS = [
  "This needs to be completed as soon as possible to unblock other work.",
  "Low priority but would be nice to have for the next release.",
  "Critical bug affecting production users. Needs immediate attention.",
  "Part of the Q1 roadmap initiatives.",
  "Technical debt that should be addressed before adding new features.",
  "User-requested feature with high demand.",
  "Security improvement to meet compliance requirements.",
  "Performance optimization for better user experience.",
  "Documentation update for new developers.",
  "Testing improvement to increase code coverage.",
  null,
  null,
  null,
];

const PRIORITIES = ["none", "low", "medium", "high", "urgent"] as const;
const STATUSES = ["backlog", "todo", "in_progress", "review", "done"] as const;
const TAG_OPTIONS = [
  "bug",
  "feature",
  "enhancement",
  "documentation",
  "refactor",
  "testing",
];

function randomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randomTags(): string[] {
  const count = Math.floor(Math.random() * 3); // 0-2 tags
  const tags: string[] = [];
  for (let i = 0; i < count; i++) {
    const tag = randomElement(TAG_OPTIONS);
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags;
}

// List all boards
export const listBoards = createServerFn({ method: "GET" }).handler(async () => {
  const db = getDb();
  const result = await db
    .select({ id: boards.id, name: boards.name, slug: boards.slug })
    .from(boards)
    .orderBy(boards.createdAt);
  return result;
});

// Create a new board
export const createBoard = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string; slug: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    const boardId = uuidv4();
    const now = new Date();

    // Check for slug uniqueness and generate a unique one if needed
    let finalSlug = data.slug;
    let suffix = 1;
    while (true) {
      const existing = await db
        .select({ id: boards.id })
        .from(boards)
        .where(eq(boards.slug, finalSlug))
        .limit(1);

      if (existing.length === 0) break;

      suffix++;
      finalSlug = `${data.slug}-${suffix}`;
    }

    const prefix = generatePrefix(data.name);

    await db.insert(boards).values({
      id: boardId,
      name: data.name,
      slug: finalSlug,
      displayIdPrefix: prefix,
      nextCardNumber: 1,
      createdAt: now,
      updatedAt: now,
    });

    return { id: boardId, name: data.name, slug: finalSlug, displayIdPrefix: prefix };
  });

// Clear all cards from a board
export const clearBoardCards = createServerFn({ method: "POST" })
  .inputValidator((data: { boardId: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    await db.delete(cards).where(eq(cards.boardId, data.boardId));
    await invalidateBoardCache(data.boardId);
    return { success: true };
  });

// Generate seed data for a board
export const generateSeedData = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { boardId: string; count: number; clearExisting: boolean }) => data,
  )
  .handler(async ({ data }) => {
    const db = getDb();
    const { boardId, count, clearExisting } = data;

    // Clear existing cards if requested
    if (clearExisting) {
      await db.delete(cards).where(eq(cards.boardId, boardId));
    }

    // Get board's prefix and current card number
    const [board] = await db.select().from(boards).where(eq(boards.id, boardId));
    if (!board) {
      throw new Error("Board not found");
    }
    const prefix = board.displayIdPrefix;
    let nextNumber = board.nextCardNumber;

    // Get last position for each status (to append after existing cards)
    const lastPositionByStatus: Record<string, string | null> = {};
    for (const status of STATUSES) {
      const [lastCard] = await db
        .select({ position: cards.position })
        .from(cards)
        .where(
          and(
            eq(cards.boardId, boardId),
            eq(cards.status, status),
            isNull(cards.deletedAt),
          ),
        )
        .orderBy(desc(cards.position))
        .limit(1);
      lastPositionByStatus[status] = lastCard?.position ?? null;
    }

    // Distribute cards across statuses
    const cardsPerStatus = Math.floor(count / STATUSES.length);
    const remainder = count % STATUSES.length;

    const cardValues: Array<{
      id: string;
      displayId: string;
      title: string;
      description: string | null;
      position: string;
      priority: (typeof PRIORITIES)[number];
      status: (typeof STATUSES)[number];
      tags: string | null;
      boardId: string;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    const now = new Date();

    for (let statusIndex = 0; statusIndex < STATUSES.length; statusIndex++) {
      const status = STATUSES[statusIndex]!;
      const cardCount = cardsPerStatus + (statusIndex < remainder ? 1 : 0);
      let lastPosition: string | null = lastPositionByStatus[status] ?? null;

      for (let i = 0; i < cardCount; i++) {
        const id = uuidv4();
        const displayId = `${prefix}-${nextNumber}`;
        const position = generateKeyBetween(lastPosition, null);
        lastPosition = position;

        const tags = randomTags();

        cardValues.push({
          id,
          displayId,
          title: randomElement(TITLES),
          description: randomElement(DESCRIPTIONS),
          position,
          priority: randomElement(PRIORITIES),
          status,
          tags: tags.length > 0 ? JSON.stringify(tags) : null,
          boardId,
          createdAt: now,
          updatedAt: now,
        });

        nextNumber++;
      }
    }

    // Batch insert cards in chunks of 8 (8 cards × 12 columns = 96 params < D1's 100 param limit)
    const BATCH_SIZE = 8;
    for (let i = 0; i < cardValues.length; i += BATCH_SIZE) {
      const batch = cardValues.slice(i, i + BATCH_SIZE);
      await db.insert(cards).values(batch);
    }

    // Update board's nextCardNumber
    await db
      .update(boards)
      .set({ nextCardNumber: nextNumber })
      .where(eq(boards.id, boardId));

    await invalidateBoardCache(boardId);

    return { success: true, count: cardValues.length };
  });

// Delete a board and all its cards
export const deleteBoard = createServerFn({ method: "POST" })
  .inputValidator((data: { boardId: string }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    // Delete all cards first
    await db.delete(cards).where(eq(cards.boardId, data.boardId));
    // Then delete the board
    await db.delete(boards).where(eq(boards.id, data.boardId));
    return { success: true };
  });
