import { useEffect, useState } from "react";
import { Play, Clock } from "@phosphor-icons/react";
import { getAllProgress, type ProgressEntry } from "../state/watchProgress";
import type { YawnShelfItem } from "../types/yawn";

interface Props {
  plugins: { manifest: { id: string; name: string }; iconUrl?: string }[];
  onSelectItem: (item: YawnShelfItem, pluginId: string) => void;
}

export function HomePage({ plugins, onSelectItem }: Props) {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);

  useEffect(() => {
    setEntries(getAllProgress());
  }, []);

  function toShelfItem(e: ProgressEntry): YawnShelfItem {
    return {
      id: e.tmdbId,
      tmdbId: e.tmdbId,
      title: e.title,
      poster: e.poster,
      type: e.mediaType === "movie" ? "movie" : "series",
    };
  }

  function pluginName(id: string) {
    return plugins.find((p) => p.manifest.id === id)?.manifest.name ?? id;
  }

  function formatTime(secs: number) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">Home</h1>
        <p className="text-neutral-500 text-sm">Pick up where you left off</p>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4 text-neutral-600">
          <Clock size={56} />
          <p className="text-xl font-semibold">Nothing yet</p>
          <p className="text-sm text-neutral-700">
            Start watching something and it'll appear here
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-bold mb-5">▶ Continue Watching</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {entries.map((e) => {
              const epLabel =
                e.season != null && e.episode != null
                  ? `S${String(e.season).padStart(2, "0")}E${String(e.episode).padStart(2, "0")}`
                  : null;
              const pct = Math.round(e.percent * 100);

              return (
                <button
                  key={`${e.pluginId}:${e.tmdbId}:${e.season}:${e.episode}`}
                  onClick={() => onSelectItem(toShelfItem(e), e.pluginId)}
                  className="group text-left focus:outline-none"
                >
                  {/* Thumbnail */}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-800 mb-3 group-hover:ring-2 ring-red-500 transition-all">
                    {e.poster ? (
                      <img
                        src={e.poster}
                        alt={e.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <Play size={28} />
                      </div>
                    )}

                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center">
                        <Play size={20} weight="fill" />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                      <div
                        className="h-full bg-red-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Time remaining */}
                    <span className="absolute bottom-2 right-2 bg-black/75 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                      {formatTime(e.duration - e.currentTime)} left
                    </span>
                  </div>

                  {/* Info */}
                  <p className="text-white font-semibold text-sm truncate group-hover:text-red-400 transition-colors">
                    {e.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {epLabel && (
                      <span className="text-neutral-500 text-xs font-mono">
                        {epLabel}
                      </span>
                    )}
                    <span className="text-neutral-600 text-xs">
                      {pluginName(e.pluginId)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
