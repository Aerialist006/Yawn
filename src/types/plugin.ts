export type YwnContentType =
  | "Movie"
  | "Series"
  | "Anime"
  | "AnimeMovie"
  | "AsianDrama"
  | "Live"
  | "Other";

export interface YwnManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description?: string;
  permissions: string[];
  provides: string[]; // hook names: "home" | "search" | "streams" | "meta"
  types: YwnContentType[]; // ← NEW: what content categories this plugin serves
  entry: string;
}

export interface YwnPlugin {
  manifest: YwnManifest;
  enabled: boolean;
  installedAt: string;
  iconUrl?: string;
}
