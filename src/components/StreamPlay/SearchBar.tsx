import { useState, useEffect } from "react";
import { api } from "../../lib/invoke";
import type { YawnMediaItem } from "../../types/yawn";

interface Props {
  onResults: (items: YawnMediaItem[]) => void;
}

export function SearchBar({ onResults }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      onResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await api.spSearch(query.trim());
        onResults(results);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <input
        type="text"
        placeholder="Search movies & shows..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 bg-neutral-900 text-white border border-neutral-700 rounded-lg px-4 py-2.5 text-base outline-none focus:border-red-600 transition-colors"
        autoFocus
      />
      {loading && <span className="text-red-500 animate-spin text-xl">⟳</span>}
    </div>
  );
}
