import { invoke } from "@tauri-apps/api/core";
import type { YawnMediaItem, YawnStream } from "../types/yawn";
import type { YwnPlugin } from "../types/plugin";

export async function getInstalledPlugins(): Promise<YwnPlugin[]> {
  return invoke<YwnPlugin[]>("ywn_list");
}

async function callHook<T>(
  plugin: YwnPlugin,
  hook: string,
  args: object,
): Promise<T[]> {
  try {
    const raw = await invoke<string>("ywn_call_hook", {
      id: plugin.manifest.id,
      hook,
      argsJson: JSON.stringify(args),
    });
    return JSON.parse(raw) as T[];
  } catch (e) {
    console.warn(
      `[YWN] Plugin ${plugin.manifest.id} hook "${hook}" failed:`,
      e,
    );
    return [];
  }
}

export async function runPluginCatalog(
  query: string,
  coreResults: YawnMediaItem[],
): Promise<YawnMediaItem[]> {
  const plugins = await getInstalledPlugins();
  const enabled = plugins.filter(
    (p) => p.enabled && p.manifest.provides.includes("catalog"),
  );

  const pluginResults = await Promise.all(
    enabled.map((p) => callHook<YawnMediaItem>(p, "catalog", { query })),
  );

  const merged = [...coreResults];
  const seenIds = new Set(coreResults.map((r) => r.id));

  for (const results of pluginResults) {
    for (const item of results) {
      if (!seenIds.has(item.id)) {
        merged.push(item);
        seenIds.add(item.id);
      }
    }
  }

  return merged;
}

export async function runPluginStreams(
  args: {
    imdbId: string;
    tmdbId: string;
    mediaType: string;
    season?: number;
    episode?: number;
  },
  coreStreams: YawnStream[],
): Promise<YawnStream[]> {
  const plugins = await getInstalledPlugins();
  const enabled = plugins.filter(
    (p) => p.enabled && p.manifest.provides.includes("streams"),
  );

  const pluginResults = await Promise.all(
    enabled.map((p) => callHook<YawnStream>(p, "streams", args)),
  );

  return [...coreStreams, ...pluginResults.flat()];
}
