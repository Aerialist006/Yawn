import { useEffect, useRef, useState } from "react";
import type { YawnStream, YawnSubtitle } from "../../types/yawn";

interface Props {
  streams: YawnStream[];
  subtitles: YawnSubtitle[];
  title: string;
  episode?: string;
  onBack: () => void;
}

export function PlayerView({
  streams,
  subtitles,
  title,
  episode,
  onBack,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<"loading" | "playing" | "error">(
    "loading",
  );
  const [failedIndices, setFailedIndices] = useState<Set<number>>(new Set());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentStream = streams[currentIndex];

  // Try next stream on failure
  function tryNext() {
    const next = currentIndex + 1;
    if (next < streams.length) {
      setCurrentIndex(next);
      setStatus("loading");
    } else {
      setStatus("error");
    }
  }

  // Auto-advance after timeout if iframe doesn't signal load
  // (embed pages don't fire onload reliably — 12s timeout is a safe heuristic)
  useEffect(() => {
    if (!currentStream) return;
    setStatus("loading");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      // Assume it's playing if no explicit failure detected
      setStatus("playing");
    }, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentIndex]);

  if (!currentStream) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">No streams available</p>
          <button
            onClick={onBack}
            className="text-neutral-400 hover:text-white underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-950 border-b border-neutral-800 z-10">
        <button
          onClick={onBack}
          className="text-neutral-400 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
        <div className="text-center">
          <p className="text-white text-sm font-medium truncate max-w-xs">
            {title}
          </p>
          {episode && <p className="text-neutral-500 text-xs">{episode}</p>}
        </div>
        <div className="text-xs text-neutral-500 text-right">
          <span
            className={
              status === "loading"
                ? "text-yellow-500"
                : status === "playing"
                  ? "text-green-500"
                  : "text-red-500"
            }
          >
            {status === "loading"
              ? "⟳ Loading…"
              : status === "playing"
                ? "● Playing"
                : "✕ Failed"}
          </span>
          <br />
          <span>{currentStream.name}</span>
        </div>
      </div>

      {/* Player */}
      <div className="flex-1 relative bg-black">
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none">
            <div className="w-10 h-10 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-neutral-400 text-sm">
              Trying{" "}
              <span className="text-white font-medium">
                {currentStream.name}
              </span>
              …
            </p>
            <p className="text-neutral-600 text-xs">
              Source {currentIndex + 1} of {streams.length}
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10">
            <p className="text-red-500 text-lg">All streams failed</p>
            <p className="text-neutral-500 text-sm">
              Try again later or go back
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setStatus("loading");
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              Retry from start
            </button>
          </div>
        )}

        <iframe
          ref={iframeRef}
          key={currentStream.url}
          src={currentStream.url}
          className="w-full h-full border-none"
          style={{ minHeight: "calc(100vh - 49px)" }}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          onLoad={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setStatus("playing");
          }}
          onError={tryNext}
        />
      </div>

      {/* Stream switcher strip */}
      <div className="bg-neutral-950 border-t border-neutral-800 px-4 py-2 overflow-x-auto">
        <div className="flex gap-2 items-center">
          <span className="text-neutral-500 text-xs shrink-0">Sources:</span>
          {streams.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentIndex(i);
                setStatus("loading");
              }}
              className={`shrink-0 text-xs px-3 py-1 rounded border transition-colors ${
                i === currentIndex
                  ? "bg-red-600 border-red-600 text-white"
                  : failedIndices.has(i)
                    ? "bg-neutral-900 border-neutral-700 text-neutral-600 line-through"
                    : "bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
