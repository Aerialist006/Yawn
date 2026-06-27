import type { YawnShelfItem } from "../../types/yawn";

interface Props {
  item: YawnShelfItem;
  onPlay: () => void;
}

export function HeroBanner({ item, onPlay }: Props) {
  return (
    <div className="relative w-full" style={{ aspectRatio: "21/9" }}>
      {item.backdrop && (
        <img src={item.backdrop} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
      <div className="absolute bottom-12 left-10 max-w-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
            {item.type === "movie" ? "Movie" : item.type === "anime" ? "Anime" : "Series"}
          </span>
          {item.year && <span className="text-neutral-400 text-sm">{item.year}</span>}
          {item.rating && (
            <span className="text-yellow-400 text-sm font-semibold">★ {item.rating}</span>
          )}
        </div>
        <h1 className="text-5xl font-black leading-tight mb-3 drop-shadow-2xl">{item.title}</h1>
        {item.overview && (
          <p className="text-neutral-300 text-sm leading-relaxed line-clamp-3 mb-5">
            {item.overview}
          </p>
        )}
        <button
          onClick={onPlay}
          className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl text-base transition-colors"
        >
          ▶ Watch Now
        </button>
      </div>
    </div>
  );
}