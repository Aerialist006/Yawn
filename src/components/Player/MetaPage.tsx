import { useState, useEffect } from "react";
import { api } from "../../lib/invoke";
import type {
  YawnMediaItem,
  YawnMeta,
  YawnEpisode,
  StreamResult,
  YawnStream,
} from "../../types/yawn";
import { SeasonPicker } from "./SeasonPicker";
import { StreamPicker } from "./StreamPicker";
import { PlayerView } from "../Player";

interface Props {
  item: YawnMediaItem;
  onBack: () => void;
}

export function MetaPage({ item, onBack }: Props) {
  const [meta, setMeta] = useState<YawnMeta | null>(null);
  const [activeSeason, setActiveSeason] = useState(1);
  const [activeEpisode, setActiveEpisode] = useState<YawnEpisode | null>(null);
  const [streams, setStreams] = useState<StreamResult | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingMeta(true);
      try {
        const m = await api.spGetMeta(item.id, item.mediaType);
        setMeta(m);
        if (item.mediaType === "movie" && m.item.imdbId) {
          await fetchStreams(m.item.imdbId, m.item.id);
        }
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, [item.id]);

  async function fetchStreams(
    imdbId: string,
    tmdbId: string,
    season?: number,
    episode?: number,
  ) {
    setLoadingStreams(true);
    setStreams(null);
    try {
      const result = await api.spGetStreams(
        imdbId,
        tmdbId,
        item.mediaType,
        season,
        episode,
      );
      setStreams(result);
      return result;
    } finally {
      setLoadingStreams(false);
    }
  }

  async function handleEpisodeSelect(ep: YawnEpisode) {
    setActiveEpisode(ep);
    const imdbId = meta?.item.imdbId;
    if (!imdbId) return;
    const result = await fetchStreams(imdbId, item.id, ep.season, ep.episode);
    if (result && result.streams.length > 0) {
      setShowPlayer(true);
    }
  }

  function handleMoviePlay() {
    if (streams && streams.streams.length > 0) setShowPlayer(true);
  }

  if (showPlayer && streams) {
    const episodeLabel = activeEpisode
      ? `S${String(activeEpisode.season).padStart(2, "0")}E${String(activeEpisode.episode).padStart(2, "0")} · ${activeEpisode.title ?? ""}`
      : undefined;

    return (
      <PlayerView
        streams={streams.streams}
        subtitles={streams.subtitles}
        title={meta?.item.title ?? item.title}
        episodeLabel={episodeLabel} // ← string label for display
        tmdbId={item.id}
        mediaType={item.mediaType}
        season={activeEpisode?.season} // ← number for Rust
        episode={activeEpisode?.episode} // ← number for Rust
        onBack={() => setShowPlayer(false)}
      />
    );
  }

  if (loadingMeta) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center relative">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-neutral-400 hover:text-white text-sm"
        >
          ← Back
        </button>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!meta) return null;
  const { item: detail, seasons } = meta;

  return (
    <div className="min-h-screen bg-neutral-950 text-white relative">
      {detail.backdrop && (
        <div
          className="fixed inset-0 bg-cover bg-center opacity-20 blur-sm z-0"
          style={{ backgroundImage: `url(${detail.backdrop})` }}
        />
      )}

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="mb-6 text-sm text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 px-3 py-1.5 rounded-md transition-colors"
        >
          ← Back
        </button>

        <div className="flex gap-6 mb-8">
          {detail.poster && (
            <img
              src={detail.poster}
              alt={detail.title}
              className="w-40 rounded-lg shrink-0 shadow-xl"
            />
          )}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl font-bold mb-2">{detail.title}</h1>
            <div className="flex gap-2 flex-wrap mb-3">
              {detail.year && (
                <span className="text-xs bg-neutral-800 px-2.5 py-1 rounded text-neutral-300">
                  {detail.year}
                </span>
              )}
              {detail.rating && (
                <span className="text-xs bg-neutral-800 px-2.5 py-1 rounded text-yellow-400">
                  ★ {detail.rating.toFixed(1)}
                </span>
              )}
              {detail.genres?.map((g) => (
                <span
                  key={g}
                  className="text-xs bg-neutral-800 px-2.5 py-1 rounded text-neutral-300"
                >
                  {g}
                </span>
              ))}
            </div>
            {detail.overview && (
              <p className="text-neutral-400 text-sm leading-relaxed max-w-xl line-clamp-4">
                {detail.overview}
              </p>
            )}

            {item.mediaType === "movie" && (
              <button
                onClick={handleMoviePlay}
                disabled={loadingStreams || !streams}
                className="mt-4 w-fit flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors"
              >
                {loadingStreams ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Loading…
                  </>
                ) : (
                  <>▶ Play</>
                )}
              </button>
            )}
          </div>
        </div>

        {seasons && seasons.length > 0 && (
          <SeasonPicker
            seasons={seasons}
            activeSeason={activeSeason}
            activeEpisode={activeEpisode?.episode ?? null}
            onSeasonChange={setActiveSeason}
            onEpisodeSelect={handleEpisodeSelect}
          />
        )}

        {loadingStreams && (
          <div className="flex items-center gap-3 mt-6 text-neutral-400 text-sm">
            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            Fetching streams…
          </div>
        )}
      </div>
    </div>
  );
}
