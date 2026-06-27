import { CaretLeft } from "@phosphor-icons/react";
import { PosterCard } from "./PosterCard";
import type { YawnShelfItem } from "../../types/yawn";

interface Props {
  query: string;
  results: YawnShelfItem[];
  activeId: string | null;
  onSelect: (item: YawnShelfItem, pluginId: string) => void;
  onClear: () => void;
}

export function SearchResults({
  query,
  results,
  activeId,
  onSelect,
  onClear,
}: Props) {
  return (
    <div className="px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onClear}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          <CaretLeft size={20} />
        </button>
        <h2 className="text-xl font-bold">
          Results for <span className="text-red-400">"{query}"</span>
        </h2>
        <span className="text-neutral-500 text-sm">{results.length} found</span>
      </div>
      {results.length === 0 ? (
        <p className="text-neutral-500">No results found.</p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4">
          {results.map((item) => (
            <PosterCard
              key={item.id}
              item={item}
              onClick={() => activeId && onSelect(item, activeId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
