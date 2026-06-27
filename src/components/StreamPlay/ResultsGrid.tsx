import type { YawnMediaItem } from "../../types/yawn";
import { MediaCard } from "./MediaCard";

interface Props {
  items: YawnMediaItem[];
  onSelect: (item: YawnMediaItem) => void;
}

export function ResultsGrid({ items, onSelect }: Props) {
  if (!items.length) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 px-4 pb-8">
      {items.map((item) => (
        <MediaCard key={item.id} item={item} onClick={onSelect} />
      ))}
    </div>
  );
}
