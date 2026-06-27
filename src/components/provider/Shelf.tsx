import { useRef } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { PosterCard } from "./PosterCard";
import { prefetchTmdb } from "../../state/tmdbCache";
import type { YawnShelf, YawnShelfItem } from "../../types/yawn";

interface Props {
  shelf: YawnShelf;
  onSelect: (item: YawnShelfItem) => void;
}

export function Shelf({ shelf, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: "l" | "r") =>
    ref.current?.scrollBy({
      left: dir === "r" ? 500 : -500,
      behavior: "smooth",
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">{shelf.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("l")}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
          >
            <CaretLeft size={14} />
          </button>
          <button
            onClick={() => scroll("r")}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center transition-colors"
          >
            <CaretRight size={14} />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {shelf.items.map((item) => (
          <PosterCard
            key={item.id}
            item={item}
            onClick={() => onSelect(item)}
            onHover={() => {
              if (item.tmdbId) {
                prefetchTmdb([
                  {
                    tmdbId: item.tmdbId,
                    type: item.type === "movie" ? "movie" : "tv",
                  },
                ]);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
