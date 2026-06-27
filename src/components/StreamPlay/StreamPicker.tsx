import type { YawnStream, YawnSubtitle } from "../../types/yawn";

interface Props {
  streams: YawnStream[];
  subtitles: YawnSubtitle[];
  onPlay: (stream: YawnStream) => void;
}

const TYPE_ICON: Record<string, string> = {
  hls: "📡",
  mp4: "🎬",
  dash: "📊",
  embed: "🌐",
};

export function StreamPicker({ streams, subtitles, onPlay }: Props) {
  return (
    <div className="mt-6">
      <h3 className="text-white font-semibold text-lg mb-3">
        Available Streams
      </h3>
      <div className="flex flex-col gap-2">
        {streams.map((s, i) => (
          <button
            key={i}
            onClick={() => onPlay(s)}
            className="flex items-center gap-3 px-4 py-3 bg-neutral-900 border border-neutral-700 hover:border-red-600 rounded-lg text-left transition-colors group"
          >
            <span className="text-lg">{TYPE_ICON[s.streamType] ?? "▶"}</span>
            <span className="flex-1 text-white font-medium text-sm">
              {s.name}
            </span>
            {s.quality && (
              <span className="text-xs text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                {s.quality}
              </span>
            )}
          </button>
        ))}
      </div>

      {subtitles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-neutral-400 text-sm font-medium mb-2">
            Subtitles ({subtitles.length})
          </h4>
          <div className="flex gap-2 flex-wrap">
            {subtitles.slice(0, 8).map((sub, i) => (
              <span
                key={i}
                className="text-xs text-neutral-400 bg-neutral-900 border border-neutral-700 px-2.5 py-1 rounded"
              >
                {sub.language}
              </span>
            ))}
            {subtitles.length > 8 && (
              <span className="text-xs text-neutral-500 px-2.5 py-1">
                +{subtitles.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
