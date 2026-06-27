import type { YawnSeason, YawnEpisode } from "../../types/yawn";

interface Props {
  seasons: YawnSeason[];
  activeSeason: number;
  activeEpisode: number | null;
  onSeasonChange: (s: number) => void;
  onEpisodeSelect: (ep: YawnEpisode) => void;
}

export function SeasonPicker({
  seasons,
  activeSeason,
  activeEpisode,
  onSeasonChange,
  onEpisodeSelect,
}: Props) {
  const season = seasons.find((s) => s.number === activeSeason);

  return (
    <div className="mt-6">
      {/* Season tabs */}
      <div className="flex gap-2 flex-wrap mb-4">
        {seasons.map((s) => (
          <button
            key={s.number}
            onClick={() => onSeasonChange(s.number)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              s.number === activeSeason
                ? "bg-red-600 border-red-600 text-white"
                : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            S{s.number}
          </button>
        ))}
      </div>

      {/* Episode list */}
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
        {season?.episodes.map((ep) => (
          <div
            key={ep.id}
            onClick={() => onEpisodeSelect(ep)}
            className={`flex items-center gap-3 p-3 rounded-lg bg-neutral-900 cursor-pointer border transition-colors ${
              ep.episode === activeEpisode
                ? "border-red-600"
                : "border-transparent hover:border-neutral-600"
            }`}
          >
            {ep.still && (
              <img
                src={ep.still}
                alt=""
                className="w-28 aspect-video object-cover rounded"
              />
            )}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-red-500 font-bold text-sm shrink-0">
                  E{String(ep.episode).padStart(2, "0")}
                </span>
                <span className="text-white text-sm truncate">
                  {ep.title ?? `Episode ${ep.episode}`}
                </span>
              </div>
              {ep.runtime && (
                <span className="text-neutral-500 text-xs mt-0.5">
                  {ep.runtime}m
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
