import { env } from "cloudflare:workers";

/**
 * Edge cache layer using Cloudflare KV
 *
 * Cache-aside pattern:
 * 1. Check cache first
 * 2. If miss, fetch from DB
 * 3. Store in cache with TTL
 * 4. Invalidate on mutations
 */

// Type for KV binding
type KVNamespace = {
  get: (key: string) => Promise<string | null>;
  put: (
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ) => Promise<void>;
  delete: (key: string) => Promise<void>;
};

// Cache key patterns
export const cacheKeys = {
  board: (boardId: string) => `board:${boardId}`,
  boardList: () => "boards:list",
};

// Default TTL: 5 minutes
const DEFAULT_TTL = 300;

/**
 * Get the KV cache binding (if available)
 * Returns undefined in development without KV
 */
function getCache(): KVNamespace | undefined {
  return (env as { CACHE?: KVNamespace }).CACHE;
}

/**
 * Get cached data or fetch from source
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL,
): Promise<T> {
  const cache = getCache();

  // Try cache first
  if (cache) {
    try {
      const cached = await cache.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch {
      // Cache read failed, continue to fetcher
    }
  }

  // Fetch from source
  const data = await fetcher();

  // Store in cache (fire and forget)
  if (cache && data) {
    cache.put(key, JSON.stringify(data), { expirationTtl: ttl }).catch(() => {
      // Ignore cache write errors
    });
  }

  return data;
}

/**
 * Invalidate cache key(s)
 */
export async function invalidateCache(keys: string | string[]): Promise<void> {
  const cache = getCache();
  if (!cache) return;

  const keysToInvalidate = Array.isArray(keys) ? keys : [keys];

  await Promise.all(
    keysToInvalidate.map((key) =>
      cache.delete(key).catch(() => {
        // Ignore cache delete errors
      }),
    ),
  );
}

/**
 * Invalidate all board-related caches
 */
export async function invalidateBoardCache(boardId?: string): Promise<void> {
  const keysToInvalidate = [cacheKeys.boardList()];

  if (boardId) {
    keysToInvalidate.push(cacheKeys.board(boardId));
  }

  await invalidateCache(keysToInvalidate);
}
