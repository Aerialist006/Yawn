import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  SpeakerHigh,
  SpeakerLow,
  SpeakerX,
  Subtitles,
  MonitorPlay,
  CaretDown,
  ArrowsOut,
  PictureInPicture,
  UploadSimple,
} from "@phosphor-icons/react";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  title: string;
  episodeLabel?: string;
  streams: { name: string }[];
  currentStreamIndex: number;
  onStreamChange: (i: number) => void;
  onBack: () => void;
  subtitleTracks: { label: string; language: string }[];
  currentSubIndex: number;
  onSubChange: (i: number) => void;
  onImportSub: () => void;
  isEmbed: boolean;
}

function formatTime(s: number) {
  if (isNaN(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

export function PlayerControls({
  videoRef,
  title,
  episodeLabel,
  streams,
  currentStreamIndex,
  onStreamChange,
  onBack,
  subtitleTracks,
  currentSubIndex,
  onSubChange,
  onImportSub,
  isEmbed,
}: Props) {
  const [visible, setVisible] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [showServers, setShowServers] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHideTimer = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrentTime(v.currentTime);
    const onMeta = () => setDuration(v.duration);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
    };
  }, [videoRef]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Number(e.target.value);
  }

  function changeVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    v.volume = val;
    setVolume(val);
    setMuted(val === 0);
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  function skip(secs: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(v.currentTime + secs, 0), v.duration);
  }

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const VolumeIcon =
    muted || volume === 0 ? SpeakerX : volume < 0.5 ? SpeakerLow : SpeakerHigh;

  const topBar = (
    <div
      className={`absolute top-0 left-0 right-0 z-20 px-4 py-3 flex items-center gap-3
      bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300
      ${visible || isEmbed ? "opacity-100" : "opacity-0"}`}
    >
      <button
        onClick={onBack}
        className="text-white hover:text-red-400 transition-colors"
      >
        <ArrowLeft size={20} weight="fill" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{title}</p>
        {episodeLabel && (
          <p className="text-neutral-400 text-xs">{episodeLabel}</p>
        )}
      </div>

      {/* Server picker */}
      <div className="relative">
        <button
          onClick={() => {
            setShowServers(!showServers);
            setShowSubs(false);
          }}
          className="flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-700
            hover:border-neutral-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
        >
          <MonitorPlay size={14} weight="fill" />
          <span className="max-w-[100px] truncate">
            {streams[currentStreamIndex]?.name ?? "Server"}
          </span>
          <CaretDown size={12} weight="fill" className="text-neutral-400" />
        </button>

        {showServers && (
          <div
            className="absolute right-0 top-full mt-1 bg-neutral-900 border border-neutral-700
            rounded-lg overflow-hidden shadow-xl z-50 min-w-[160px] max-h-64 overflow-y-auto"
          >
            {streams.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  onStreamChange(i);
                  setShowServers(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-neutral-800 transition-colors
                  ${i === currentStreamIndex ? "text-red-400 bg-neutral-800" : "text-white"}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (isEmbed) return topBar;

  return (
    <div
      className="absolute inset-0 z-20"
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
    >
      {topBar}

      {/* Center click zone */}
      <div
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onDoubleClick={toggleFullscreen}
        onClick={togglePlay}
      />

      {/* Skip buttons */}
      <div
        className={`absolute inset-0 flex items-center justify-between px-16 pointer-events-none
        transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            skip(-10);
          }}
          className="pointer-events-auto w-14 h-14 rounded-full bg-black/40 flex flex-col items-center
            justify-center text-white hover:bg-black/60 transition-colors gap-0.5"
        >
          <span className="text-[10px] font-bold leading-none">-10</span>
          <span className="text-[9px] text-neutral-300 leading-none">sec</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            skip(10);
          }}
          className="pointer-events-auto w-14 h-14 rounded-full bg-black/40 flex flex-col items-center
            justify-center text-white hover:bg-black/60 transition-colors gap-0.5"
        >
          <span className="text-[10px] font-bold leading-none">+10</span>
          <span className="text-[9px] text-neutral-300 leading-none">sec</span>
        </button>
      </div>

      {/* Bottom controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12
        bg-gradient-to-t from-black/90 to-transparent
        transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        {/* Seek bar */}
        <div className="relative mb-3 group">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={seek}
            className="w-full h-1 appearance-none bg-neutral-600 rounded-full cursor-pointer
              accent-red-500 group-hover:h-1.5 transition-all"
          />
          <div
            className="absolute top-0 left-0 h-1 bg-red-500 rounded-full pointer-events-none
              group-hover:h-1.5 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="text-white hover:text-red-400 transition-colors"
          >
            {playing ? (
              <Pause size={22} weight="fill" />
            ) : (
              <Play size={22} weight="fill" />
            )}
          </button>

          {/* Skip intro */}
          <button
            onClick={() => skip(85)}
            className="text-xs text-white border border-neutral-600 hover:border-white
              px-2.5 py-1 rounded transition-colors"
          >
            Skip Intro
          </button>

          {/* Time */}
          <span className="text-white text-xs tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-white hover:text-red-400 transition-colors"
            >
              <VolumeIcon size={20} weight="fill" />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={changeVolume}
              className="w-20 accent-white cursor-pointer"
            />
          </div>

          {/* Subtitles */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSubs(!showSubs);
                setShowServers(false);
              }}
              className={`transition-colors hover:text-white
                ${currentSubIndex >= 0 ? "text-red-400" : "text-neutral-400"}`}
            >
              <Subtitles size={20} weight="fill" />
            </button>
            {showSubs && (
              <div
                className="absolute bottom-full right-0 mb-2 bg-neutral-900 border border-neutral-700
                rounded-lg overflow-hidden shadow-xl z-50 min-w-[180px] max-h-64 overflow-y-auto"
              >
                <button
                  onClick={() => {
                    onSubChange(-1);
                    setShowSubs(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs hover:bg-neutral-800 transition-colors
                    ${currentSubIndex === -1 ? "text-red-400 bg-neutral-800" : "text-white"}`}
                >
                  Off
                </button>
                {subtitleTracks.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onSubChange(i);
                      setShowSubs(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-neutral-800 transition-colors
                      ${i === currentSubIndex ? "text-red-400 bg-neutral-800" : "text-white"}`}
                  >
                    {t.label || t.language}
                  </button>
                ))}
                <div className="border-t border-neutral-700">
                  <button
                    onClick={() => {
                      onImportSub();
                      setShowSubs(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-neutral-400
                      hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <UploadSimple size={12} weight="fill" />
                    Import file…
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PiP */}
          <button
            onClick={() => videoRef.current?.requestPictureInPicture?.()}
            className="text-neutral-400 hover:text-white transition-colors"
            title="Picture in Picture"
          >
            <PictureInPicture size={20} weight="fill" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-red-400 transition-colors"
          >
            <ArrowsOut size={20} weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}
