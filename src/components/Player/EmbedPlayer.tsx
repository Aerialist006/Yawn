import { useEffect, useRef } from "react";
import { PlayerControls } from "./PlayerControls";
import { saveProgress } from "../../state/watchProgress";

interface Props {
  url: string;
  streams: { name: string; url: string; streamType: string }[];
  currentStreamIndex: number;
  onStreamChange: (i: number) => void;
  title: string;
  episodeLabel?: string;
  onBack: () => void;
  // Progress context — passed from StreamLoader
  pluginId: string;
  tmdbId: string;
  mediaType: "movie" | "tv";
  poster?: string;
  season?: number;
  episode?: number;
}

export function EmbedPlayer({
  url,
  streams,
  currentStreamIndex,
  onStreamChange,
  title,
  episodeLabel,
  onBack,
  pluginId,
  tmdbId,
  mediaType,
  poster,
  season,
  episode,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      // Videasy sends: { type: "timeUpdate", currentTime, duration }
      // Also handle generic { currentTime, duration } shape
      const d = e.data;
      if (!d || typeof d !== "object") return;

      const currentTime: number = d.currentTime ?? d.current_time ?? null;
      const duration: number = d.duration ?? null;

      if (currentTime == null || !duration || duration < 10) return;

      // Throttle: only save every 5 seconds of playback
      saveProgress({
        tmdbId,
        mediaType,
        title,
        poster,
        pluginId,
        season,
        episode,
        currentTime,
        duration,
        percent: currentTime / duration,
        lastWatched: Date.now(),
      });
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [tmdbId, pluginId, season, episode]);

  return (
    <div className="relative w-full h-full bg-black">
      <iframe
        ref={iframeRef}
        key={url}
        src={url}
        className="w-full h-full border-none"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      />
      <PlayerControls
        videoRef={{ current: null } as any}
        title={title}
        episodeLabel={episodeLabel}
        streams={streams}
        currentStreamIndex={currentStreamIndex}
        onStreamChange={onStreamChange}
        onBack={onBack}
        subtitleTracks={[]}
        currentSubIndex={-1}
        onSubChange={() => {}}
        onImportSub={() => {}}
        isEmbed={true}
      />
    </div>
  );
}
