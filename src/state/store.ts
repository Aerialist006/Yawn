import { create } from "zustand";
import type { AddonDefinition, StremioMetaPreview } from "../types/stremio";
import { api } from "../lib/invoke";

interface YawnStore {
  // Addons
  addons: AddonDefinition[];
  loadAddons: () => Promise<void>;
  installAddon: (url: string) => Promise<void>;
  uninstallAddon: (url: string) => Promise<void>;

  // Catalog
  catalog: Record<string, StremioMetaPreview[]>;
  loadCatalog: (
    transportUrl: string,
    type: string,
    id: string,
  ) => Promise<void>;

  // Navigation
  activePage: "home" | "addons";
  setActivePage: (page: "home" | "addons") => void;
}

export const useStore = create<YawnStore>((set, get) => ({
  addons: [],
  catalog: {},

  loadAddons: async () => {
    const addons = await api.listAddons();
    set({ addons });
  },

  installAddon: async (url) => {
    await api.installAddon(url);
    const addons = await api.listAddons();
    set({ addons });
  },

  uninstallAddon: async (url) => {
    await api.uninstallAddon(url);
    const addons = await api.listAddons();
    set({ addons });
  },

  loadCatalog: async (transportUrl, type, id) => {
    const key = `${transportUrl}|${type}|${id}`;
    const items = await api.getCatalog(transportUrl, type, id);
    set((s) => ({ catalog: { ...s.catalog, [key]: items } }));
  },

  activePage: "home",
  setActivePage: (page) => set({ activePage: page }),
}));
