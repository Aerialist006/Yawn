import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  FilmSlate,
  Television,
  PuzzlePiece,
  Gear,
  List,
  X,
} from "@phosphor-icons/react";
import { ProviderHomePage } from "./pages/ProviderHomePage";
import { PluginsPage } from "./pages/PluginsPage";
import type { YwnPlugin } from "./types/plugin";
import type { YawnShelfItem } from "./types/yawn";
import type { ProviderTab } from "./state/providerStore";

type View = "movies" | "anime" | "plugins" | "settings";

export default function App() {
  const [view, setView] = useState<View>("movies");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plugins, setPlugins] = useState<YwnPlugin[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    item: YawnShelfItem;
    pluginId: string;
  } | null>(null);

  async function loadPlugins() {
    const list = await invoke<YwnPlugin[]>("ywn_list").catch(() => []);
    setPlugins(list);
  }

  useEffect(() => {
    loadPlugins();
  }, []);
  useEffect(() => {
    if (view === "plugins") loadPlugins();
  }, [view]);

  const nav: { id: View; label: string; icon: React.ReactNode }[] = [
    {
      id: "movies",
      label: "Movies & TV",
      icon: <FilmSlate size={22} weight="fill" />,
    },
    {
      id: "anime",
      label: "Anime",
      icon: <Television size={22} weight="fill" />,
    },
    {
      id: "plugins",
      label: "Plugins",
      icon: <PuzzlePiece size={22} weight="fill" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Gear size={22} weight="fill" />,
    },
  ];

  // TODO: render selectedItem detail page (MetaPage) when implemented
  // if (selectedItem) return <MetaPage ... />

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
        fixed top-0 left-0 h-full w-60 bg-neutral-900 border-r border-white/5 flex flex-col z-30
        transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto
      `}
      >
        {/* Logo */}
        <div className="px-6 py-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-red-500 text-2xl font-black tracking-tighter">
              YAWN
            </span>
          </div>
          <button
            className="lg:hidden text-neutral-500 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                setSidebarOpen(false);
              }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                transition-all duration-150 text-left w-full
                ${
                  view === item.id
                    ? "bg-red-600 text-white shadow-lg shadow-red-900/30"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }
              `}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/5">
          <p className="text-[11px] text-neutral-700">Yawn v0.1.0</p>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-neutral-950/90 backdrop-blur shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-neutral-400 hover:text-white"
          >
            <List size={24} />
          </button>
          <span className="text-red-500 text-xl font-black tracking-tighter">
            YAWN
          </span>
        </header>

        <main className="flex-1 overflow-y-auto">
          {(view === "movies" || view === "anime") && (
            <ProviderHomePage
              tab={view as ProviderTab}
              plugins={plugins}
              onSelectItem={(item, pluginId) =>
                setSelectedItem({ item, pluginId })
              }
            />
          )}
          {view === "plugins" && <PluginsPage onPluginsChanged={loadPlugins} />}
          {view === "settings" && (
            <div className="px-8 py-10 max-w-2xl">
              <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                <Gear size={28} weight="fill" className="text-red-500" />{" "}
                Settings
              </h1>
              <p className="text-neutral-500">Coming soon.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
