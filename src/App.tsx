import { useState } from "react";
import { SearchBar, ResultsGrid, MetaPage } from "./components/StreamPlay";
import { PluginsPage } from "./pages/PluginsPage";
import type { YawnMediaItem } from "./types/yawn";
import { FilmSlate, PuzzlePiece, Gear, List, X } from "@phosphor-icons/react";

type View = "home" | "plugins" | "settings";

function App() {
  const [results, setResults] = useState<YawnMediaItem[]>([]);
  const [selected, setSelected] = useState<YawnMediaItem | null>(null);
  const [view, setView] = useState<View>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (selected) {
    return <MetaPage item={selected} onBack={() => setSelected(null)} />;
  }

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    {
      id: "home",
      label: "Browse",
      icon: <FilmSlate size={20} weight="fill" />,
    },
    {
      id: "plugins",
      label: "Plugins",
      icon: <PuzzlePiece size={20} weight="fill" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Gear size={20} weight="fill" />,
    },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-56 bg-neutral-900 border-r border-neutral-800
          flex flex-col z-30 transition-transform duration-200
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-neutral-800">
          <span className="text-red-500 text-xl font-black tracking-tight">
            YAWN
          </span>
          <button
            className="lg:hidden text-neutral-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setSidebarOpen(false);
              }}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-colors text-left w-full
                ${
                  view === item.id
                    ? "bg-red-600 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-neutral-800">
          <p className="text-[10px] text-neutral-600">v0.1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden sticky top-0 z-10 bg-neutral-950/80 backdrop-blur border-b border-neutral-800 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-neutral-400 hover:text-white"
          >
            <List size={22} />
          </button>
          <span className="text-red-500 text-lg font-black tracking-tight">
            YAWN
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {view === "home" && (
            <div className="max-w-6xl mx-auto">
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
            </div>
          )}

          {view === "plugins" && <PluginsPage />}

          {view === "settings" && (
            <div className="max-w-3xl mx-auto px-6 py-8">
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Gear size={26} weight="fill" className="text-red-500" />
                Settings
              </h1>
              <p className="text-neutral-500 text-sm">Coming soon.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
