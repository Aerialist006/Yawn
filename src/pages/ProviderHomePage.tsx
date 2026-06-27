import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { CaretLeft, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import type { YwnPlugin } from "../types/plugin";
import type { YawnHomepage, YawnShelf, YawnShelfItem } from "../types/yawn";
import {
  getActiveProvider,
  setActiveProvider,
  type ProviderTab,
} from "../state/providerStore";

interface Props {
  tab: ProviderTab;
  plugins: YwnPlugin[];
  onSelectItem: (item: YawnShelfItem, pluginId: string) => void;
}

export function ProviderHomePage({ tab, plugins, onSelectItem }: Props) {
  const tabPlugins = plugins.filter((p) => {
    if (!p.enabled) return false;
    const t = p.manifest.types ?? []; // ← was crashing if types missing
    if (t.length === 0) return true; // ← no types = show in both tabs
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

  // Restore saved provider
  useEffect(() => {
    const saved = getActiveProvider(tab);
    const match = tabPlugins.find((p) => p.manifest.id === saved);
    const chosen = match ?? tabPlugins[0] ?? null;
    setActiveId(chosen?.manifest.id ?? null);
  }, [tab, plugins.length]);

  // Load homepage
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
      .then((raw) => setHomepage(JSON.parse(raw)))
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
      setSearchResults(JSON.parse(raw));
    } finally {
      setSearching(false);
    }
  }

  const activePlugin = tabPlugins.find((p) => p.manifest.id === activeId);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 text-white">
      {/* ── Top Bar ── */}
      <div className="sticky top-0 z-30 flex items-center gap-4 px-8 py-4 bg-neutral-950/95 backdrop-blur border-b border-white/5">
        {/* Provider picker */}
        <div className="flex items-center gap-3 shrink-0">
          {activePlugin?.iconUrl && (
            <img
              src={activePlugin.iconUrl}
              className="w-8 h-8 rounded-md"
              alt=""
            />
          )}
          {tabPlugins.length <= 1 ? (
            <span className="text-white font-bold text-lg">
              {activePlugin?.manifest.name ??
                (tab === "movies" ? "Movies & TV" : "Anime")}
            </span>
          ) : (
            <select
              value={activeId ?? ""}
              onChange={(e) => pickProvider(e.target.value)}
              className="bg-neutral-800 border border-neutral-700 text-white text-base font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 cursor-pointer min-w-[180px]"
            >
              {tabPlugins.map((p) => (
                <option key={p.manifest.id} value={p.manifest.id}>
                  {p.manifest.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Search bar */}
        <form
          className="flex-1 flex items-center gap-3 max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            doSearch(search);
          }}
        >
          <div className="relative flex-1">
            <MagnifyingGlass
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!e.target.value) setSearchResults(null);
              }}
              placeholder={`Search ${tab === "movies" ? "movies & shows" : "anime"}…`}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl text-white text-base pl-11 pr-4 py-2.5 focus:outline-none focus:border-red-500 placeholder:text-neutral-500"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-base transition-colors shrink-0"
          >
            {searching ? "…" : "Search"}
          </button>
        </form>
      </div>

      {/* ── Empty state ── */}
      {tabPlugins.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 text-neutral-600 py-40">
          <span className="text-7xl">🧩</span>
          <p className="text-xl font-semibold">No plugins installed</p>
          <p className="text-sm text-neutral-700">
            Go to Plugins and install a .ywn file to get started
          </p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-40">
          <div className="w-12 h-12 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Search Results ── */}
      {!loading && searchResults && (
        <div className="px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => {
                setSearchResults(null);
                setSearch("");
              }}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <CaretLeft size={20} />
            </button>
            <h2 className="text-xl font-bold">
              Results for <span className="text-red-400">"{search}"</span>
            </h2>
            <span className="text-neutral-500 text-sm">
              {searchResults.length} found
            </span>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-neutral-500">No results found.</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4">
              {searchResults.map((item) => (
                <PosterCard
                  key={item.id}
                  item={item}
                  onClick={() => activeId && onSelectItem(item, activeId)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Homepage ── */}
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

// ── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({
  item,
  onPlay,
}: {
  item: YawnShelfItem;
  onPlay: () => void;
}) {
  return (
    <div className="relative w-full" style={{ aspectRatio: "21/9" }}>
      {item.backdrop && (
        <img
          src={item.backdrop}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
      <div className="absolute bottom-12 left-10 max-w-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
            {item.type === "movie"
              ? "Movie"
              : item.type === "anime"
                ? "Anime"
                : "Series"}
          </span>
          {item.year && (
            <span className="text-neutral-400 text-sm">{item.year}</span>
          )}
          {item.rating && (
            <span className="text-yellow-400 text-sm font-semibold">
              ★ {item.rating}
            </span>
          )}
        </div>
        <h1 className="text-5xl font-black leading-tight mb-3 drop-shadow-2xl">
          {item.title}
        </h1>
        {item.overview && (
          <p className="text-neutral-300 text-sm leading-relaxed line-clamp-3 mb-5">
            {item.overview}
          </p>
        )}
        <button
          onClick={onPlay}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl text-base transition-colors"
        >
          ▶ Watch Now
        </button>
      </div>
    </div>
  );
}

// ── Shelf ────────────────────────────────────────────────────────────────────
function Shelf({
  shelf,
  onSelect,
}: {
  shelf: YawnShelf;
  onSelect: (i: YawnShelfItem) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: "l" | "r") =>
    ref.current?.scrollBy({
      left: dir === "r" ? 500 : -500,
      behavior: "smooth",
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">{shelf.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("l")}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
          >
            <CaretLeft size={14} />
          </button>
          <button
            onClick={() => scroll("r")}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
          >
            <CaretRight size={14} />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {shelf.items.map((item) => (
          <PosterCard
            key={item.id}
            item={item}
            onClick={() => onSelect(item)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Poster Card ──────────────────────────────────────────────────────────────
function PosterCard({
  item,
  onClick,
}: {
  item: YawnShelfItem;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-36 group text-left focus:outline-none"
    >
      <div className="relative w-36 h-52 rounded-xl overflow-hidden bg-neutral-800 group-hover:ring-2 group-focus:ring-2 ring-red-500 transition-all duration-150 group-hover:scale-105">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-4xl">
            🎬
          </div>
        )}
        {item.rating && (
          <span className="absolute top-2 right-2 bg-black/75 text-yellow-400 text-[11px] font-bold px-1.5 py-0.5 rounded-md">
            ★ {item.rating}
          </span>
        )}
      </div>
      <p className="text-sm text-neutral-300 mt-2 line-clamp-2 group-hover:text-white transition-colors font-medium">
        {item.title}
      </p>
      {item.year && (
        <p className="text-xs text-neutral-600 mt-0.5">{item.year}</p>
      )}
    </button>
  );
}
