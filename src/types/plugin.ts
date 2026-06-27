export interface YwnManifest {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  permissions: ("network" | "storage")[];
  provides: ("catalog" | "streams" | "meta")[];
  entry: string;
}

export interface YwnPlugin {
  manifest: YwnManifest;
  enabled: boolean;
  installedAt: string;
  iconUrl?: string;
}
