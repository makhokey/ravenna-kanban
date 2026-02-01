import { env } from "cloudflare:workers";
import { createDb } from "@repo/db";

// Access D1 binding from Cloudflare Workers environment
export function getDb() {
  const db = (env as { DB?: D1Database }).DB;

  if (!db) {
    throw new Error("D1 database binding not found.");
  }

  return createDb(db);
}
