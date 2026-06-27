import { useState } from "react";
import { SearchBar, ResultsGrid, MetaPage } from "./components/StreamPlay";
import type { YawnMediaItem } from "./types/yawn";

function App() {
  const [results, setResults] = useState<YawnMediaItem[]>([]);
  const [selected, setSelected] = useState<YawnMediaItem | null>(null);

  if (selected) {
    return <MetaPage item={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center gap-3">
        <span className="text-red-500 text-xl font-black tracking-tight">
          YAWN
        </span>
        <span className="text-neutral-600 text-sm">·</span>
        <span className="text-neutral-400 text-sm">StreamPlay</span>
      </header>

      <main className="max-w-6xl mx-auto">
        <SearchBar onResults={setResults} />

        {results.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-32 gap-4 text-center px-4">
            <span className="text-6xl">🎬</span>
            <h2 className="text-2xl font-semibold text-white">
              Search for anything
            </h2>
            <p className="text-neutral-500 text-sm max-w-xs">
              Movies, TV shows, anime — search above to find and stream
              instantly.
            </p>
          </div>
        ) : (
          <ResultsGrid items={results} onSelect={setSelected} />
        )}
      </main>
    </div>
  );
}

export default App;
