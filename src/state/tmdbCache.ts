// ── Config ────────────────────────────────────────────────────────────────────
const MEM_TTL = 10 * 60 * 1000; // 10 min in-memory
const DISK_TTL = 60 * 60 * 1000; // 1 hour localStorage

interface CacheEntry<T> {
  data: T;
  ts: number;
}

// ── In-memory (survives back-navigation, lost on app restart) ─────────────────
const memCache = new Map<string, CacheEntry<any>>();

function memGet<T>(key: string): T | null {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > MEM_TTL) {
    memCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function memSet<T>(key: string, data: T) {
  memCache.set(key, { data, ts: Date.now() });
}

// ── localStorage (survives restart, ~5MB budget) ──────────────────────────────
const LS_PREFIX = "ywn_tmdb_";

function diskGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > DISK_TTL) {
      localStorage.removeItem(LS_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function diskSet<T>(key: string, data: T) {
  try {
    localStorage.setItem(
      LS_PREFIX + key,
      JSON.stringify({ data, ts: Date.now() }),
    );
  } catch {
    // localStorage full — silently skip disk cache
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Fetch with two-layer cache. Checks memory first, then disk, then network.
 * Populates both layers on a real fetch.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  // 1. Memory hit → instant
  const mem = memGet<T>(key);
  if (mem) return mem;

  // 2. Disk hit → fast, also repopulate memory
  const disk = diskGet<T>(key);
  if (disk) {
    memSet(key, disk);
    return disk;
  }

  // 3. Network fetch → populate both layers
  const data = await fetcher();
  memSet(key, data);
  diskSet(key, data);
  return data;
}

/** Prefetch a list of TMDB IDs in the background without blocking UI */
export function prefetchTmdb(ids: { tmdbId: string; type: "movie" | "tv" }[]) {
  const key = (import.meta as any).env?.VITE_TMDB_KEY ?? "";
  if (!key) return;

  ids.forEach(({ tmdbId, type }) => {
    const cacheKey = `detail_${type}_${tmdbId}`;
    if (memGet(cacheKey) || diskGet(cacheKey)) return; // already cached
    // Fire and forget — don't await
    fetch(`https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${key}`)
      .then((r) => r.json())
      .then((data) => {
        memSet(cacheKey, data);
        diskSet(cacheKey, data);
      })
      .catch(() => {}); // silent
  });
}

/** Clear all TMDB cache (useful for a Settings "Clear Cache" button) */
export function clearTmdbCache() {
  memCache.clear();
  const toDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(LS_PREFIX)) toDelete.push(k);
  }
  toDelete.forEach((k) => localStorage.removeItem(k));
}
