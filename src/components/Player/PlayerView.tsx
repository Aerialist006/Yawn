import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { YawnStream, YawnSubtitle } from "../../types/yawn";
import { NativePlayer } from "./NativePlayer";
import { EmbedPlayer } from "./EmbedPlayer";

interface Props {
  streams: YawnStream[];
  subtitles: YawnSubtitle[];
  title: string;
  episodeLabel?: string;
  tmdbId: string;
  mediaType: string;
  season?: number;
  episode?: number;
  onBack: () => void;
}

type ResolvedStream =
  | { mode: "native"; url: string; index: number }
  | { mode: "embed"; url: string; index: number }
  | { mode: "loading"; index: number }
  | { mode: "error" };

export function PlayerView({
  streams,
  subtitles,
  title,
  episodeLabel,
  tmdbId,
  mediaType,
  season,
  episode,
  onBack,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [resolved, setResolved] = useState<ResolvedStream>({
    mode: "loading",
    index: 0,
  });

  useEffect(() => {
    resolveStream(0);
  }, []);

  async function resolveStream(index: number) {
    if (index >= streams.length) {
      setResolved({ mode: "error" });
      return;
    }

    const stream = streams[index];
    setCurrentIndex(index);
    setResolved({ mode: "loading", index });

    if (stream.name === "Videasy") {
      try {
        const url = await invoke<string | null>("sp_extract_stream", {
          tmdbId,
          mediaType,
          season,
          episode,
        });
        if (url) {
          setResolved({ mode: "native", url, index });
          return;
        }
      } catch {
        // fall through to embed
      }
    }

    setResolved({ mode: "embed", url: stream.url, index });
  }

  function handleStreamChange(i: number) {
    resolveStream(i);
  }

  const streamList = streams.map((s) => ({
    name: s.name,
    url: s.url,
    streamType: s.streamType,
  }));

  if (resolved.mode === "error") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-red-500 text-xl">All streams failed</p>
        <button
          onClick={() => resolveStream(0)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
        >
          Retry
        </button>
        <button
          onClick={onBack}
          className="text-neutral-400 hover:text-white text-sm underline"
        >
          Go back
        </button>
      </div>
    );
  }

  if (resolved.mode === "loading") {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-3 text-white">
        <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-400 text-sm">
          Loading{" "}
          <span className="text-white font-medium">
            {streams[resolved.index]?.name}
          </span>
          …
        </p>
      </div>
    );
  }

  const commonProps = {
    streams: streamList,
    currentStreamIndex: currentIndex,
    onStreamChange: handleStreamChange,
    title,
    episodeLabel,
    onBack,
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      {resolved.mode === "native" ? (
        <NativePlayer
          {...commonProps}
          url={resolved.url}
          autoSubtitles={subtitles}
        />
      ) : (
        <EmbedPlayer {...commonProps} url={resolved.url} />
      )}
    </div>
  );
}
