import type { YawnMediaItem } from "../../types/yawn";

interface Props {
  item: YawnMediaItem;
  onClick: (item: YawnMediaItem) => void;
}

const PLACEHOLDER = "https://via.placeholder.com/300x450?text=No+Poster";

export function MediaCard({ item, onClick }: Props) {
  return (
    <div
      className="cursor-pointer rounded-lg overflow-hidden bg-neutral-900 hover:scale-105 transition-transform duration-200 group"
      onClick={() => onClick(item)}
    >
      <img
        src={item.poster ?? PLACEHOLDER}
        alt={item.title}
        className="w-full aspect-[2/3] object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = PLACEHOLDER;
        }}
      />
      <div className="p-2">
        <span className="block font-semibold text-sm text-white truncate">
          {item.title}
        </span>
        <span className="block text-xs text-neutral-400 mt-0.5">
          {item.year}
          {item.year && " · "}
          {item.mediaType === "tv" ? "TV" : "Movie"}
          {item.rating ? ` · ★ ${item.rating.toFixed(1)}` : ""}
        </span>
      </div>
    </div>
  );
}
