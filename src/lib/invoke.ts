import { invoke } from "@tauri-apps/api/core";
import type {
  AddonDefinition,
  StremioMetaPreview,
  StremioMetaItem,
  StremioStream,
} from "../types/stremio";

export const api = {
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
};
