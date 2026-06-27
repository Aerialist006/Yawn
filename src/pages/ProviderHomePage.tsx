import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ProviderTopBar } from "../components/provider/ProviderTopBar";
import { HeroBanner } from "../components/provider/HeroBanner";
import { Shelf } from "../components/provider/Shelf";
import { SearchResults } from "../components/provider/SearchResults";
import {
  getActiveProvider,
  setActiveProvider,
  type ProviderTab,
} from "../state/providerStore";
import type { YwnPlugin } from "../types/plugin";
import type { YawnHomepage, YawnShelfItem } from "../types/yawn";

interface Props {
  tab: ProviderTab;
  plugins: YwnPlugin[];
  onSelectItem: (item: YawnShelfItem, pluginId: string) => void;
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

  useEffect(() => {
    const saved = getActiveProvider(tab);
    const match = tabPlugins.find((p) => p.manifest.id === saved);
    const chosen = match ?? tabPlugins[0] ?? null;
    setActiveId(chosen?.manifest.id ?? null);
  }, [tab, plugins.length]);

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

      {/* Empty state */}
      {tabPlugins.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-neutral-600 py-40">
          <span className="text-7xl">🧩</span>
          <p className="text-xl font-semibold">No plugins installed</p>
          <p className="text-sm text-neutral-700">
            Go to Plugins and install a .ywn file to get started
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-40">
          <div className="w-12 h-12 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Search results */}
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

      {/* Homepage */}
      {!loading && !searchResults && homepage && (
        <div className="flex flex-col">
          {homepage.hero && (
            <HeroBanner
              item={homepage.hero}
              onPlay={() => activeId && onSelectItem(homepage.hero!, activeId)}
            />
          )}
          <div className="flex flex-col gap-10 px-8 py-8">
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
