import { useEffect, useState } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import type { YwnPlugin } from "../types/plugin";
import {
  PuzzlePiece,
  Trash,
  ToggleLeft,
  ToggleRight,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";

interface Props {
  onPluginsChanged?: () => void;
}

export function PluginsPage({ onPluginsChanged }: Props) {
  const [plugins, setPlugins] = useState<YwnPlugin[]>([]);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const list = await invoke<YwnPlugin[]>("ywn_list");
    setPlugins(list);
    onPluginsChanged?.();
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleInstall() {
    setError(null);
    const selected = await invoke<string | null>("pick_ywn_file");
    if (!selected) return;
    setInstalling(true);
    try {
      await invoke("ywn_install", { path: selected });
      await reload();
    } catch (e: any) {
      setError(String(e));
    } finally {
      setInstalling(false);
    }
  }

  async function handleRemove(id: string) {
    await invoke("ywn_remove", { id });
    await reload();
  }

  async function handleToggle(id: string, current: boolean) {
    await invoke("ywn_toggle", { id, enabled: !current });
    await reload();
  }

  function getIconSrc(iconUrl: string): string {
    // iconUrl from Rust is "file:///absolute/path/icon.png"
    // Strip file:// and convert to Tauri asset URL
    const path = iconUrl.replace(/^file:\/\//, "");
    return convertFileSrc(path);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-6 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PuzzlePiece size={26} weight="fill" className="text-red-500" />
            Plugins
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Install .ywn files to extend Yawn with extra sources and catalogs
          </p>
        </div>
        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-neutral-700
            disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {installing ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <UploadSimple size={16} weight="fill" />
          )}
          Install .ywn
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 mb-6 text-sm text-red-300">
          <WarningCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {plugins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500 gap-3">
          <PuzzlePiece size={48} weight="thin" />
          <p className="text-sm">No plugins installed</p>
          <p className="text-xs text-neutral-600">
            Install a .ywn file to get started
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {plugins.map((p) => (
            <div
              key={p.manifest.id}
              className={`flex items-center gap-4 bg-neutral-900 border rounded-xl px-4 py-4 transition-colors
                ${p.enabled ? "border-neutral-700" : "border-neutral-800 opacity-60"}`}
            >
              <div className="w-11 h-11 rounded-lg bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden">
                {p.iconUrl ? (
                  <img
                    src={getIconSrc(p.iconUrl)}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // fallback to puzzle icon if image fails
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <PuzzlePiece
                    size={22}
                    weight="fill"
                    className="text-neutral-500"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {p.manifest.name}
                  </span>
                  <span className="text-xs text-neutral-500">
                    v{p.manifest.version}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 truncate">
                  {p.manifest.description ?? p.manifest.id}
                </p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {p.manifest.provides.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleToggle(p.manifest.id, p.enabled)}
                  className="text-neutral-400 hover:text-white transition-colors"
                  title={p.enabled ? "Disable" : "Enable"}
                >
                  {p.enabled ? (
                    <ToggleRight
                      size={28}
                      weight="fill"
                      className="text-red-500"
                    />
                  ) : (
                    <ToggleLeft size={28} weight="fill" />
                  )}
                </button>
                <button
                  onClick={() => handleRemove(p.manifest.id)}
                  className="text-neutral-500 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <Trash size={18} weight="fill" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-neutral-700 mt-8 text-center">
        Plugin JS runs in a sandboxed context · network access only via
        fetchSync()
      </p>
    </div>
  );
}
