import type { StremioMetaPreview } from "../../types/stremio";

interface Props {
  item: StremioMetaPreview;
  onClick: (item: StremioMetaPreview) => void;
}

export function MediaCard({ item, onClick }: Props) {
  return (
    <button
      onClick={() => onClick(item)}
      className="group relative flex flex-col gap-2 text-left"
    >
      <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-neutral-800">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
            No poster
          </div>
        )}
        {item.imdbRating && (
          <span className="absolute top-2 right-2 bg-black/70 text-yellow-400 text-xs font-medium px-1.5 py-0.5 rounded">
            ★ {item.imdbRating}
          </span>
        )}
      </div>
      <span className="text-neutral-200 text-sm font-medium leading-tight line-clamp-2">
        {item.name}
      </span>
      {item.releaseInfo && (
        <span className="text-neutral-500 text-xs">{item.releaseInfo}</span>
      )}
    </button>
  );
}