/**
 * 🧠 SIMPLE REQUEST-SCOPED CACHE
 * ===============================
 *
 * A trivial in-memory cache that lives for the duration of a single
 * server-side render (Firestore Web SDK is reused across requests,
 * so a module-level Map is sufficient — Next.js's Node worker
 * handles request isolation).
 *
 * Why does this exist?
 * --------------------
 *  - Several server components read the same Firestore collection
 *    (e.g. `getAllWallpapersFromFirestore`). Without caching, each
 *    component makes its own network round-trip, ballooning page
 *    TTFB.
 *  - We previously had a wallpaper detail page that fired 3 parallel
 *    Firestore queries AND fetched 500 documents per query on every
 *    visit. With the cache, repeated reads in the same request cost
 *    one network call each.
 *
 * NOT a substitute for ISR or React's `cache()`. This is just a
 * deduplication helper for the server-side data layer.
 */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 5_000; // 5 seconds — enough to dedupe within a single request

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Read or compute a value. The factory is only invoked on a miss.
 * On a hit, the cached value is returned synchronously.
 */
export async function cached<T>(
  key: string,
  factory: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) {
    return hit.value;
  }
  const value = await factory();
  store.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

/**
 * Invalidate a single key. Used by write helpers (e.g. after a
 * wallpaper edit is applied) to ensure the next read is fresh.
 */
export function invalidate(key: string): void {
  store.delete(key);
}

/**
 * Invalidate every key that starts with the given prefix. Used to
 * bust wallpapers-related cache after a bulk write.
 */
export function invalidatePrefix(prefix: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

/**
 * Reset the entire cache. Mainly useful for tests.
 */
export function clearCache(): void {
  store.clear();
}
