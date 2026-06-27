import type { YawnShelfItem } from "../../types/yawn";

interface Props {
  item: YawnShelfItem;
  onClick: () => void;
  onHover?: () => void;
}

export function PosterCard({ item, onClick, onHover }: Props) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      className="flex-shrink-0 w-36 group text-left focus:outline-none"
    >
      <div className="relative w-36 h-52 rounded-xl overflow-hidden bg-neutral-800 group-hover:ring-2 group-focus:ring-2 ring-red-500 transition-all duration-150 group-hover:scale-105">
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-4xl">
            🎬
          </div>
        )}
        {item.rating && (
          <span className="absolute top-2 right-2 bg-black/75 text-yellow-400 text-[11px] font-bold px-1.5 py-0.5 rounded-md">
            ★ {item.rating}
          </span>
        )}
      </div>
      <p className="text-sm text-neutral-300 mt-2 line-clamp-2 group-hover:text-white transition-colors font-medium">
        {item.title}
      </p>
      {item.year && (
        <p className="text-xs text-neutral-600 mt-0.5">{item.year}</p>
      )}
    </button>
  );
}
