export type ProviderTab = "movies" | "anime";

export function getActiveProvider(tab: ProviderTab): string | null {
  return localStorage.getItem(`ywn_active_provider_${tab}`);
}

export function setActiveProvider(tab: ProviderTab, pluginId: string) {
  localStorage.setItem(`ywn_active_provider_${tab}`, pluginId);
}
