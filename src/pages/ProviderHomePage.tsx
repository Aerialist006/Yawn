import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X } from "@phosphor-icons/react";
import { ProviderTopBar } from "../components/provider/ProviderTopBar";
import { HeroBanner } from "../components/provider/HeroBanner";
import { Shelf } from "../components/provider/Shelf";
import { SearchResults } from "../components/provider/SearchResults";
import {
  getActiveProvider,
  setActiveProvider,
  type ProviderTab,
} from "../state/providerStore";
import {
  getAllProgress,
  removeProgress,
  type ProgressEntry,
} from "../state/watchProgress";
import type { YwnPlugin } from "../types/plugin";
import type { YawnHomepage, YawnShelfItem } from "../types/yawn";

interface Props {
  tab: ProviderTab;
  plugins: YwnPlugin[];
  onSelectItem: (item: YawnShelfItem, pluginId: string) => void;
}

function progressToShelfItem(e: ProgressEntry): YawnShelfItem {
  return {
    id: e.tmdbId,
    tmdbId: e.tmdbId,
    title: e.title,
    poster: e.poster,
    type: e.mediaType === "movie" ? "movie" : "series",
  };
}

export function ProviderHomePage({ tab, plugins, onSelectItem }: Props) {
  const tabPlugins = plugins.filter((p) => {
    if (!p.enabled) return false;
    const t = p.manifest.types ?? [];
    if (t.length === 0) return true;
    return tab === "movies"
      ? t.some((x) =>
          ["Movie", "Series", "AsianDrama", "AnimeMovie"].includes(x),
        )
      : t.some((x) => ["Anime", "AnimeMovie"].includes(x));
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [homepage, setHomepage] = useState<YawnHomepage | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<YawnShelfItem[] | null>(
    null,
  );
  const [searching, setSearching] = useState(false);
  const [recentItems, setRecentItems] = useState<ProgressEntry[]>([]);

  useEffect(() => {
    const saved = getActiveProvider(tab);
    const match = tabPlugins.find((p) => p.manifest.id === saved);
    const chosen = match ?? tabPlugins[0] ?? null;
    setActiveId(chosen?.manifest.id ?? null);
  }, [tab, plugins.length]);

  function refreshRecent(pluginId: string | null) {
    if (!pluginId) {
      setRecentItems([]);
      return;
    }
    // Show all recents for any plugin in this tab, not just activeId
    const tabPluginIds = new Set(tabPlugins.map((p) => p.manifest.id));
    setRecentItems(
      getAllProgress().filter((e) => tabPluginIds.has(e.pluginId)),
    );
  }

  useEffect(() => {
    refreshRecent(activeId);
  }, [activeId, tab]);

  useEffect(() => {
    if (!activeId) {
      setHomepage(null);
      return;
    }
    setLoading(true);
    setHomepage(null);
    setSearch("");
    setSearchResults(null);
    invoke<string>("ywn_homepage", { id: activeId })
      .then((raw) => setHomepage(JSON.parse(raw) as YawnHomepage))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeId]);

  function pickProvider(id: string) {
    setActiveId(id);
    setActiveProvider(tab, id);
  }

  async function doSearch(q: string) {
    if (!activeId || !q.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const raw = await invoke<string>("ywn_search", {
        id: activeId,
        query: q,
      });
      setSearchResults(JSON.parse(raw) as YawnShelfItem[]);
    } finally {
      setSearching(false);
    }
  }

  function handleRemoveRecent(e: React.MouseEvent, entry: ProgressEntry) {
    e.stopPropagation();
    removeProgress(entry.pluginId, entry.tmdbId, entry.season, entry.episode);
    refreshRecent(activeId);
  }

  function formatTime(secs: number) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      <ProviderTopBar
        tab={tab}
        plugins={tabPlugins}
        activeId={activeId}
        search={search}
        searching={searching}
        onPickProvider={pickProvider}
        onSearchChange={(q) => {
          setSearch(q);
          if (!q) setSearchResults(null);
        }}
        onSearchSubmit={doSearch}
      />

      {tabPlugins.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-neutral-600 py-40">
          <span className="text-7xl">🧩</span>
          <p className="text-xl font-semibold">No plugins installed</p>
          <p className="text-sm text-neutral-700">
            Go to Plugins and install a .ywn file to get started
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-40">
          <div className="w-12 h-12 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && searchResults && (
        <SearchResults
          query={search}
          results={searchResults}
          activeId={activeId}
          onSelect={onSelectItem}
          onClear={() => {
            setSearchResults(null);
            setSearch("");
          }}
        />
      )}

      {!loading && !searchResults && homepage && (
        <div className="flex flex-col">
          {homepage.hero && (
            <HeroBanner
              item={homepage.hero}
              onPlay={() => activeId && onSelectItem(homepage.hero!, activeId)}
            />
          )}
          <div className="flex flex-col gap-10 px-8 py-8">
            {/* ── Continue Watching (injected, not from plugin) ── */}
            {recentItems.length > 0 && (
              <div>
                <h2 className="text-base font-bold mb-4 text-white">
                  ▶ Continue Watching
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {recentItems.map((entry) => {
                    const hasDuration = entry.duration > 60;
                    const pct = hasDuration
                      ? Math.min(Math.round(entry.percent * 100), 100)
                      : null;
                    const timeLeft = hasDuration
                      ? entry.duration - entry.currentTime
                      : null;
                    const epLabel =
                      entry.season != null && entry.episode != null
                        ? `S${String(entry.season).padStart(2, "0")}E${String(entry.episode).padStart(2, "0")}`
                        : null;

                    return (
                      <div
                        key={`${entry.pluginId}:${entry.tmdbId}:${entry.season}:${entry.episode}`}
                        className="group relative shrink-0 w-36"
                      >
                        {/* Remove button */}
                        <button
                          onClick={(ev) => handleRemoveRecent(ev, entry)}
                          className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove"
                        >
                          <X size={10} weight="bold" />
                        </button>

                        <button
                          onClick={() =>
                            onSelectItem(
                              progressToShelfItem(entry),
                              entry.pluginId,
                            )
                          }
                          className="w-full text-left"
                        >
                          <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800 mb-2 group-hover:ring-2 ring-red-500 transition-all">
                            {entry.poster ? (
                              <img
                                src={entry.poster}
                                alt={entry.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-neutral-800" />
                            )}

                            {/* Progress bar */}
                            {pct != null && (
                              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                                <div
                                  className="h-full bg-red-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}

                            {/* Time label */}
                            <span className="absolute bottom-2 right-1.5 bg-black/75 text-white text-[9px] font-mono px-1 py-0.5 rounded">
                              {timeLeft != null && timeLeft > 0
                                ? `${formatTime(timeLeft)} left`
                                : `${formatTime(entry.currentTime)} in`}
                            </span>
                          </div>

                          <p className="text-white text-xs font-semibold truncate group-hover:text-red-400">
                            {entry.title}
                          </p>
                          {epLabel && (
                            <p className="text-neutral-500 text-[10px] font-mono mt-0.5">
                              {epLabel}
                            </p>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Plugin shelves ── */}
            {homepage.shelves.map((shelf) => (
              <Shelf
                key={shelf.id}
                shelf={shelf}
                onSelect={(item) => activeId && onSelectItem(item, activeId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
