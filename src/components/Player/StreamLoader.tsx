import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, WarningCircle } from "@phosphor-icons/react";
import { PlayerView } from "./PlayerView";
import type { StreamArgs } from "./MetaPage";
import type { YawnStream, YawnSubtitle, StreamResult } from "../../types/yawn";

interface Props {
  args: StreamArgs;
  onBack: () => void;
}

export function StreamLoader({ args, onBack }: Props) {
  const [streams, setStreams] = useState<YawnStream[] | null>(null);
  const [subtitles, setSubtitles] = useState<YawnSubtitle[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const argsJson = JSON.stringify({
      tmdbId: args.tmdbId,
      imdbId: args.imdbId ?? null,
      mediaType: args.mediaType,
      season: args.season ?? null,
      episode: args.episode ?? null,
      title: args.title,
    });

    invoke<string>("ywn_call_hook", {
      id: args.pluginId,
      hook: "streams",
      argsJson,
    })
      .then((raw) => {
        const result: StreamResult | YawnStream[] = JSON.parse(raw);
        if (Array.isArray(result)) {
          setStreams(result);
          setSubtitles([]);
        } else {
          setStreams(result.streams ?? []);
          setSubtitles(result.subtitles ?? []);
        }
      })
      .catch((e: unknown) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black gap-4 text-center px-8">
        <WarningCircle size={48} className="text-red-500" />
        <p className="text-white font-bold text-lg">Failed to load streams</p>
        <p className="text-neutral-500 text-sm max-w-sm">{error}</p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  if (!streams) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black gap-3 text-white">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-400 text-sm">Fetching streams…</p>
      </div>
    );
  }

  if (streams.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black gap-4 text-center px-8">
        <WarningCircle size={48} className="text-neutral-600" />
        <p className="text-white font-bold text-lg">No streams available</p>
        <p className="text-neutral-500 text-sm">
          The plugin returned no sources for this title.
        </p>
        <button
          onClick={onBack}
          className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  const episodeLabel =
    args.season != null && args.episode != null
      ? `S${String(args.season).padStart(2, "0")}E${String(args.episode).padStart(2, "0")}`
      : undefined;

  return (
    <PlayerView
      streams={streams}
      subtitles={subtitles}
      title={args.title}
      episodeLabel={episodeLabel}
      tmdbId={args.tmdbId}
      mediaType={args.mediaType}
      season={args.season}
      episode={args.episode}
      onBack={onBack}
      // Progress context forwarded to EmbedPlayer
      pluginId={args.pluginId}
      poster={args.poster}
    />
  );
}
