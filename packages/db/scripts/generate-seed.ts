import { writeFileSync } from "node:fs";
import { v4 as uuidv4 } from "uuid";

// Column definitions with their status mappings
const columns = [
  {
    id: "22222222-2222-2222-2222-222222222201",
    name: "Backlog",
    status: "backlog",
    position: 0,
  },
  {
    id: "22222222-2222-2222-2222-222222222202",
    name: "To Do",
    status: "todo",
    position: 1,
  },
  {
    id: "22222222-2222-2222-2222-222222222203",
    name: "In Progress",
    status: "in_progress",
    position: 2,
  },
  {
    id: "22222222-2222-2222-2222-222222222204",
    name: "Review",
    status: "review",
    position: 3,
  },
  {
    id: "22222222-2222-2222-2222-222222222205",
    name: "Done",
    status: "done",
    position: 4,
  },
];

const boardId = "11111111-1111-1111-1111-111111111111";

// Pool of realistic task titles
const titles = [
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
];

// Pool of descriptions
const descriptions = [
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
  null, // Some cards have no description
  null,
  null,
];

const priorities = ["low", "medium", "high", null] as const;

const tagOptions = [
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
    const tag = randomElement(tagOptions);
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
  }
  return tags;
}

function escapeSQL(str: string | null): string {
  if (str === null) return "NULL";
  return `'${str.replace(/'/g, "''")}'`;
}

function generateSQL(): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const lines: string[] = [];

  lines.push("-- Auto-generated seed data with 200 cards");
  lines.push("-- Generated: " + new Date().toISOString());
  lines.push("");

  // Clear existing data
  lines.push("-- Clear existing data");
  lines.push("DELETE FROM cards;");
  lines.push("DELETE FROM columns;");
  lines.push("DELETE FROM boards;");
  lines.push("DELETE FROM sequences;");
  lines.push("");

  // Insert board
  lines.push("-- Board");
  lines.push(
    `INSERT INTO boards (id, name, created_at, updated_at) VALUES ('${boardId}', 'Project Alpha', ${timestamp}, ${timestamp});`,
  );
  lines.push("");

  // Insert columns
  lines.push("-- Columns");
  for (const col of columns) {
    lines.push(
      `INSERT INTO columns (id, name, position, board_id, created_at, updated_at) VALUES ('${col.id}', '${col.name}', ${col.position}, '${boardId}', ${timestamp}, ${timestamp});`,
    );
  }
  lines.push("");

  // Generate 200 cards distributed across columns
  lines.push("-- Cards (200 total)");
  const cardsPerColumn = 40;
  let cardNumber = 1;

  for (const col of columns) {
    lines.push(`-- Cards in ${col.name}`);
    for (let i = 0; i < cardsPerColumn; i++) {
      const cardId = uuidv4();
      const displayId = `RAV-${cardNumber}`;
      const title = randomElement(titles);
      const description = randomElement(descriptions);
      const position = `a${i}`;
      const priority = randomElement(priorities);
      const tags = randomTags();

      const values = [
        `'${cardId}'`,
        `'${displayId}'`,
        escapeSQL(title),
        escapeSQL(description),
        `'${position}'`,
        escapeSQL(priority),
        `'${col.status}'`,
        tags.length > 0 ? `'${JSON.stringify(tags)}'` : "NULL",
        `'${col.id}'`,
        timestamp.toString(),
        timestamp.toString(),
      ].join(", ");

      lines.push(
        `INSERT INTO cards (id, display_id, title, description, position, priority, status, tags, column_id, created_at, updated_at) VALUES (${values});`,
      );
      cardNumber++;
    }
    lines.push("");
  }

  // Insert sequence for next card ID
  lines.push("-- Sequence for card display IDs");
  lines.push(`INSERT INTO sequences (name, next_id) VALUES ('card', ${cardNumber});`);

  return lines.join("\n");
}

// Generate and write the SQL file
const sql = generateSQL();
const outputPath = new URL("../seed-200.sql", import.meta.url).pathname;
writeFileSync(outputPath, sql);
console.log(`Generated seed-200.sql with 200 cards`);
console.log(`Output: ${outputPath}`);
