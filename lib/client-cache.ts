"use client";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

export function cachedRead<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30_000
): Promise<T> {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.data);

  const existing = pending.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const p = fetcher().then(result => {
    store.set(key, { data: result, expiresAt: Date.now() + ttlMs });
    pending.delete(key);
    return result;
  }).catch(err => {
    pending.delete(key);
    throw err;
  });

  pending.set(key, p);
  return p;
}

export function invalidateClient(key: string): void {
  store.delete(key);
}

export function invalidateClientPrefix(prefix: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}

export function clearClientCache(): void {
  store.clear();
}
