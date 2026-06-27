import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Sidebar } from "./components/layout/Sidebar";
import { MobileHeader } from "./components/layout/MobileHeader";
import { MetaPage, type StreamArgs } from "./components/player";
import { ProviderHomePage } from "./pages/ProviderHomePage";
import { PluginsPage } from "./pages/PluginsPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { YwnPlugin } from "./types/plugin";
import type { YawnShelfItem } from "./types/yawn";
import type { ProviderTab } from "./state/providerStore";

export type View = "movies" | "anime" | "plugins" | "settings";

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

  // ── Detail / MetaPage overlay ──
  if (selectedItem) {
    return (
      <MetaPage
        item={selectedItem.item}
        pluginId={selectedItem.pluginId}
        onBack={() => setSelectedItem(null)}
        onPlay={(args: StreamArgs) => {
          // TODO: push to PlayerView
          console.log("Play requested:", args);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden">
      <Sidebar
        view={view}
        onNavigate={setView}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MobileHeader onMenuOpen={() => setSidebarOpen(true)} />

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
          {view === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
