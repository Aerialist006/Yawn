import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileHeader } from "./components/layout/MobileHeader";
import { MetaPage, StreamLoader, type StreamArgs } from "./components/player";
import { ProviderHomePage } from "./pages/ProviderHomePage";
import { HomePage } from "./pages/HomePage";
import { PluginsPage } from "./pages/PluginsPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { YwnPlugin } from "./types/plugin";
import type { YawnShelfItem } from "./types/yawn";
import type { ProviderTab } from "./state/providerStore";

export type View = "home" | "movies" | "anime" | "plugins" | "settings";

export default function App() {
  const [view, setView] = useState<View>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [plugins, setPlugins] = useState<YwnPlugin[]>([]);
  const [selectedItem, setSelectedItem] = useState<{
    item: YawnShelfItem;
    pluginId: string;
  } | null>(null);
  const [playArgs, setPlayArgs] = useState<StreamArgs | null>(null);

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

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      <Sidebar
        view={view}
        onNavigate={(v) => {
          setSelectedItem(null);
          setPlayArgs(null);
          setView(v);
        }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader onMenuOpen={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto relative">
          {/* Always-mounted provider pages — never unmount so state survives back */}
          <div
            className={
              view === "movies" && !selectedItem && !playArgs ? "" : "hidden"
            }
          >
            <ProviderHomePage
              tab="movies"
              plugins={plugins}
              onSelectItem={(item, pluginId) =>
                setSelectedItem({ item, pluginId })
              }
            />
          </div>
          <div
            className={
              view === "anime" && !selectedItem && !playArgs ? "" : "hidden"
            }
          >
            <ProviderHomePage
              tab="anime"
              plugins={plugins}
              onSelectItem={(item, pluginId) =>
                setSelectedItem({ item, pluginId })
              }
            />
          </div>

          {view === "home" && !selectedItem && !playArgs && (
            <HomePage
              plugins={plugins}
              onSelectItem={(item, pluginId) =>
                setSelectedItem({ item, pluginId })
              }
            />
          )}
          {view === "plugins" && !selectedItem && !playArgs && (
            <PluginsPage onPluginsChanged={loadPlugins} />
          )}
          {view === "settings" && !selectedItem && !playArgs && (
            <SettingsPage />
          )}

          {/* Detail overlay — homepage stays mounted underneath */}
          {selectedItem && !playArgs && (
            <div className="absolute inset-0 z-10 overflow-y-auto bg-neutral-950">
              <MetaPage
                item={selectedItem.item}
                pluginId={selectedItem.pluginId}
                onBack={() => setSelectedItem(null)}
                onPlay={(args) => setPlayArgs(args)}
              />
            </div>
          )}

          {/* Player overlay */}
          {playArgs && (
            <div className="absolute inset-0 z-20">
              <StreamLoader args={playArgs} onBack={() => setPlayArgs(null)} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
