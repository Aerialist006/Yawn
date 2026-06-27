import { invoke } from "@tauri-apps/api/core";
import type {
  AddonDefinition,
  StremioMetaPreview,
  StremioMetaItem,
  StremioStream,
} from "../types/stremio";
import type { YawnMediaItem, YawnMeta, StreamResult } from "../types/yawn";

export const api = {
  // ── Stremio addons ──────────────────────────────────────────────────────
  ping: () => invoke<string>("ping"),
  installAddon: (transportUrl: string) =>
    invoke<AddonDefinition>("install_addon", { transportUrl }),
  uninstallAddon: (transportUrl: string) =>
    invoke<void>("uninstall_addon", { transportUrl }),
  listAddons: () => invoke<AddonDefinition[]>("list_addons"),
  getCatalog: (
    transportUrl: string,
    catalogType: string,
    catalogId: string,
    extra?: string,
  ) =>
    invoke<StremioMetaPreview[]>("get_catalog", {
      transportUrl,
      catalogType,
      catalogId,
      extra: extra ?? null,
    }),
  getMeta: (transportUrl: string, metaType: string, metaId: string) =>
    invoke<StremioMetaItem>("get_meta", { transportUrl, metaType, metaId }),
  getStreams: (transportUrl: string, streamType: string, streamId: string) =>
    invoke<StremioStream[]>("get_streams", {
      transportUrl,
      streamType,
      streamId,
    }),

  // ── StreamPlay plugin ───────────────────────────────────────────────────
  spSearch: (query: string) => invoke<YawnMediaItem[]>("sp_search", { query }),
  spGetMeta: (tmdbId: string, mediaType: string) =>
    invoke<YawnMeta>("sp_get_meta", { tmdbId, mediaType }),
  spGetStreams: (
    imdbId: string,
    tmdbId: string,
    mediaType: string,
    season?: number,
    episode?: number,
  ) =>
    invoke<StreamResult>("sp_get_streams", {
      imdbId,
      tmdbId,
      mediaType,
      season: season ?? null,
      episode: episode ?? null,
    }),
};
