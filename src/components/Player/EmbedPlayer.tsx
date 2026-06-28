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
  pluginId: string;
  tmdbId: string;
  mediaType: "movie" | "tv";
  poster?: string;
  season?: number;
  episode?: number;
  runtimeSecs?: number;
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
  runtimeSecs,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const durationRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const lastSaveRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);

  // Update duration when TMDB runtime arrives
  useEffect(() => {
    if (runtimeSecs && runtimeSecs > 0) durationRef.current = runtimeSecs;
  }, [runtimeSecs]);

  // postMessage listener (fires if embed sends events)
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const d = e.data;
      if (!d || typeof d !== "object") return;

      if (import.meta.env.DEV) console.log("[embed msg]", d);

      if (typeof d.duration === "number" && d.duration > 10)
        durationRef.current = d.duration;

      const ct: number | null =
        typeof d.currentTime === "number"
          ? d.currentTime
          : typeof d.current_time === "number"
            ? d.current_time
            : typeof d.time === "number"
              ? d.time
              : null;

      if (ct != null && ct > 0) currentTimeRef.current = ct;

      flush();
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [tmdbId, pluginId, season, episode, title, poster, mediaType]);

  // Wall-clock fallback — saves every 15s regardless of postMessage
  useEffect(() => {
    startedAtRef.current = Date.now();
    currentTimeRef.current = 0;
    lastSaveRef.current = 0;

    const id = setInterval(() => {
      const elapsed = (Date.now() - startedAtRef.current) / 1000;
      if (elapsed < 8) return; // ignore buffering/load time
      // Use postMessage value if we got one, otherwise wall-clock
      if (currentTimeRef.current < 1) currentTimeRef.current = elapsed;
      flush(true);
    }, 15000);

    return () => clearInterval(id);
  }, [url]);

  function flush(force = false) {
    const currentTime = currentTimeRef.current;
    if (currentTime < 5) return;
    const now = Date.now();
    if (!force && now - lastSaveRef.current < 5000) return;
    lastSaveRef.current = now;

    const duration = durationRef.current;
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
      percent: duration > 0 ? Math.min(currentTime / duration, 1) : 0,
      lastWatched: now,
    });
  }

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
