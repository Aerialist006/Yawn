const LS_PREFIX = "ywn_progress_";

export interface ProgressEntry {
  tmdbId: string;
  mediaType: "movie" | "tv";
  title: string;
  poster?: string;
  pluginId: string;
  // For TV
  season?: number;
  episode?: number;
  episodeTitle?: string;
  // Progress
  currentTime: number; // seconds
  duration: number; // seconds
  percent: number; // 0–1
  lastWatched: number; // Date.now()
  // Considered "done" if percent > 0.9
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
    completed: entry.duration > 0 && entry.currentTime / entry.duration > 0.9,
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

/** Returns all progress entries across ALL providers, sorted newest first */
export function getAllProgress(): ProgressEntry[] {
  const results: ProgressEntry[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith(LS_PREFIX)) continue;
    try {
      const entry: ProgressEntry = JSON.parse(localStorage.getItem(k)!);
      if (!entry.completed) results.push(entry); // skip completed
    } catch {}
  }
  return results.sort((a, b) => b.lastWatched - a.lastWatched);
}

/** Returns all progress entries for a specific provider, newest first */
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
