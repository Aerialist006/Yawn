import { MagnifyingGlass } from "@phosphor-icons/react";
import type { YwnPlugin } from "../../types/plugin";
import type { ProviderTab } from "../../state/providerStore";
import { convertFileSrc } from "@tauri-apps/api/core";

interface Props {
  tab: ProviderTab;
  plugins: YwnPlugin[];
  activeId: string | null;
  search: string;
  searching: boolean;
  onPickProvider: (id: string) => void;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
}

export function ProviderTopBar({
  tab,
  plugins,
  activeId,
  search,
  searching,
  onPickProvider,
  onSearchChange,
  onSearchSubmit,
}: Props) {
  const activePlugin = plugins.find((p) => p.manifest.id === activeId);

  return (
    <div className="sticky top-0 z-30 flex items-center gap-4 px-8 py-4 bg-neutral-950/95 backdrop-blur border-b border-white/5">
      {/* Provider picker */}
      <div className="flex items-center gap-3 shrink-0">
        {activePlugin?.iconUrl && (
          <img
            src={convertFileSrc(
              // strip the file:// prefix since convertFileSrc wants a raw path
              activePlugin.iconUrl.replace(/^file:\/\//, ""),
            )}
            alt={activePlugin.manifest.name}
            className="w-10 h-10 rounded-lg object-cover"
          />
        )}
        {plugins.length <= 1 ? (
          <span className="text-white font-bold text-lg">
            {activePlugin?.manifest.name ??
              (tab === "movies" ? "Movies & TV" : "Anime")}
          </span>
        ) : (
          <select
            value={activeId ?? ""}
            onChange={(e) => onPickProvider(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 text-white text-base font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-500 cursor-pointer min-w-[180px]"
          >
            {plugins.map((p) => (
              <option key={p.manifest.id} value={p.manifest.id}>
                {p.manifest.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Search */}
      <form
        className="flex-1 flex items-center gap-3 max-w-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit(search);
        }}
      >
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
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
  );
}
