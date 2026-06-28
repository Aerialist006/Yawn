const LS_PREFIX = "ywn_progress_";

export interface ProgressEntry {
  tmdbId: string;
  mediaType: "movie" | "tv";
  title: string;
  poster?: string;
  pluginId: string;
  season?: number;
  episode?: number;
  currentTime: number; // seconds elapsed (wall-clock based)
  duration: number; // seconds — 0 means unknown
  percent: number; // 0–1, only meaningful when duration > 0
  lastWatched: number; // Date.now()
  completed: boolean;
}

function key(
  pluginId: string,
  tmdbId: string,
  season?: number,
  episode?: number,
) {
  if (season != null && episode != null)
    return `${LS_PREFIX}${pluginId}:${tmdbId}:S${season}E${episode}`;
  return `${LS_PREFIX}${pluginId}:${tmdbId}`;
}

export function saveProgress(entry: Omit<ProgressEntry, "completed">) {
  const k = key(entry.pluginId, entry.tmdbId, entry.season, entry.episode);
  const full: ProgressEntry = {
    ...entry,
    completed: entry.duration > 0 && entry.percent > 0.9,
  };
  try {
    localStorage.setItem(k, JSON.stringify(full));
  } catch {}
}

export function getProgress(
  pluginId: string,
  tmdbId: string,
  season?: number,
  episode?: number,
): ProgressEntry | null {
  try {
    const raw = localStorage.getItem(key(pluginId, tmdbId, season, episode));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAllProgress(): ProgressEntry[] {
  const results: ProgressEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(LS_PREFIX)) continue;
    try {
      const entry: ProgressEntry = JSON.parse(localStorage.getItem(k)!);
      if (!entry.completed) results.push(entry);
    } catch {}
  }
  return results.sort((a, b) => b.lastWatched - a.lastWatched);
}

export function getProviderProgress(pluginId: string): ProgressEntry[] {
  return getAllProgress().filter((e) => e.pluginId === pluginId);
}

export function removeProgress(
  pluginId: string,
  tmdbId: string,
  season?: number,
  episode?: number,
) {
  localStorage.removeItem(key(pluginId, tmdbId, season, episode));
}
