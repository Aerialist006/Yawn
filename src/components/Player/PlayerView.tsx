import { useState } from "react";
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
  pluginId: string;
  poster?: string;
  runtimeSecs?: number;
}

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
  pluginId,
  poster,
  runtimeSecs,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  function resolveStream(index: number) {
    if (index >= 0 && index < streams.length) {
      setCurrentIndex(index);
    }
  }

  const stream = streams[currentIndex];

  const streamList = streams.map((s) => ({
    name: s.name,
    url: s.url,
    streamType: s.streamType,
  }));

  const commonProps = {
    streams: streamList,
    currentStreamIndex: currentIndex,
    onStreamChange: resolveStream,
    title,
    episodeLabel,
    onBack,
  };

  const isDirectUrl =
    stream?.streamType === "direct" ||
    /\.(mp4|m3u8|mkv|webm)(\?|$)/i.test(stream?.url ?? "");

  return (
    <div className="fixed inset-0 bg-black z-50">
      {isDirectUrl ? (
        <NativePlayer
          {...commonProps}
          url={stream.url}
          autoSubtitles={subtitles}
        />
      ) : (
        <EmbedPlayer
          {...commonProps}
          url={stream?.url ?? ""}
          pluginId={pluginId}
          tmdbId={tmdbId}
          mediaType={mediaType as "movie" | "tv"}
          poster={poster}
          season={season}
          episode={episode}
          runtimeSecs={runtimeSecs}
        />
      )}
    </div>
  );
}
