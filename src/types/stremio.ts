export type StremioResourceName = "catalog" | "meta" | "stream" | "subtitles";

export interface StremioManifestCatalog {
  type: string;
  id: string;
  name: string;
  extra?: Array<{
    name: string;
    isRequired?: boolean;
    options?: string[];
    optionsLimit?: number;
  }>;
}

export interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description?: string;
  logo?: string;
  background?: string;
  types: string[];
  resources: Array<
    | string
    | {
        name: StremioResourceName | string;
        types?: string[];
        idPrefixes?: string[];
      }
  >;
  catalogs?: StremioManifestCatalog[];
  behaviorHints?: Record<string, unknown>;
}

export interface StremioMetaPreview {
  id: string;
  type: string;
  name: string;
  poster?: string;
  posterShape?: "square" | "poster" | "landscape";
  description?: string;
  releaseInfo?: string;
  imdbRating?: string;
  genres?: string[];
}

export interface StremioMetaItem extends StremioMetaPreview {
  background?: string;
  logo?: string;
  videos?: Array<{
    id: string;
    title?: string;
    name?: string;
    season?: number;
    episode?: number;
    released?: string;
    overview?: string;
    thumbnail?: string;
  }>;
}

export interface StremioStream {
  name?: string;
  title?: string;
  url?: string;
  ytId?: string;
  externalUrl?: string;
  infoHash?: string;
  fileIdx?: number;
  sources?: string[];
  behaviorHints?: Record<string, unknown>;
}

export interface AddonDefinition {
  transportUrl: string;
  manifestUrl: string;
  enabled: boolean;
  manifest?: StremioManifest;
}
