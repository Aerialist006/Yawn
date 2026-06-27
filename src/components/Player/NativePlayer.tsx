import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import type { SubtitleTrack } from "../../types/yawn";
import { fetchAndConvertSub, fileToVttUrl } from "../../lib/subtitles";
import { PlayerControls } from "./PlayerControls";

interface Props {
  url: string;
  streams: { name: string; url: string; streamType: string }[];
  currentStreamIndex: number;
  onStreamChange: (i: number) => void;
  title: string;
  episodeLabel?: string;
  autoSubtitles: { url: string; language: string }[];
  onBack: () => void;
}

export function NativePlayer({
  url,
  streams,
  currentStreamIndex,
  onStreamChange,
  title,
  episodeLabel,
  autoSubtitles,
  onBack,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [currentSubIndex, setCurrentSubIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;
    setLoading(true);
    setError(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls = url.includes(".m3u8") || url.includes("hls");

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError(true);
      });
    } else {
      video.src = url;
      video.oncanplay = () => {
        setLoading(false);
        video.play().catch(() => {});
      };
      video.onerror = () => setError(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

  useEffect(() => {
    if (!autoSubtitles.length) return;
    const top = autoSubtitles.slice(0, 10);
    Promise.all(
      top.map(async (s) => {
        try {
          const vttUrl = await fetchAndConvertSub(s.url);
          return {
            label: s.language,
            language: s.language,
            url: vttUrl,
          } as SubtitleTrack;
        } catch {
          return null;
        }
      }),
    ).then((results) => {
      const valid = results.filter(Boolean) as SubtitleTrack[];
      setSubtitleTracks(valid);
      const enIdx = valid.findIndex((t) =>
        t.language.toLowerCase().includes("en"),
      );
      if (enIdx >= 0) setCurrentSubIndex(enIdx);
    });
  }, [autoSubtitles]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    Array.from(video.querySelectorAll("track")).forEach((t) => t.remove());
    if (currentSubIndex < 0 || !subtitleTracks[currentSubIndex]) return;
    const track = document.createElement("track");
    track.kind = "subtitles";
    track.label = subtitleTracks[currentSubIndex].label;
    track.srclang = subtitleTracks[currentSubIndex].language;
    track.src = subtitleTracks[currentSubIndex].url;
    track.default = true;
    video.appendChild(track);
  }, [currentSubIndex, subtitleTracks]);

  async function handleImportSub() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const vttUrl = await fileToVttUrl(file);
    const newTrack: SubtitleTrack = {
      label: file.name, // ← was `📁 ${file.name}`
      language: "custom",
      url: vttUrl,
      isLocal: true,
    };
    const newTracks = [...subtitleTracks, newTrack];
    setSubtitleTracks(newTracks);
    setCurrentSubIndex(newTracks.length - 1);
  }

  return (
    <div className="relative w-full h-full bg-black select-none">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="w-12 h-12 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3">
          <p className="text-red-400 text-lg font-medium">
            Stream failed to load
          </p>
          <p className="text-neutral-500 text-sm">
            Try another server from the top bar
          </p>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        crossOrigin="anonymous"
      />

      <PlayerControls
        videoRef={videoRef}
        title={title}
        episodeLabel={episodeLabel}
        streams={streams}
        currentStreamIndex={currentStreamIndex}
        onStreamChange={onStreamChange}
        onBack={onBack}
        subtitleTracks={subtitleTracks}
        currentSubIndex={currentSubIndex}
        onSubChange={setCurrentSubIndex}
        onImportSub={handleImportSub}
        isEmbed={false}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".srt,.vtt"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
