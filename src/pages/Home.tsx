import { useEffect, useState } from "react";
import { useStore } from "../state/store";
import { CatalogRow } from "../features/catalog/CatalogRow";
import { MetaPage } from "../features/meta/MetaPage";
import type { StremioMetaPreview } from "../types/stremio";

export function HomePage() {
  const { addons, loadAddons } = useStore();
  const [selected, setSelected] = useState<{
    item: StremioMetaPreview;
    transportUrl: string;
  } | null>(null);

  useEffect(() => {
    loadAddons();
  }, []);

  if (selected) {
    return (
      <MetaPage
        transportUrl={selected.transportUrl}
        metaType={selected.item.type}
        metaId={selected.item.id}
        onBack={() => setSelected(null)}
      />
    );
  }

  const enabledAddons = addons.filter(
    (a) => a.enabled && a.manifest?.catalogs?.length,
  );

  if (enabledAddons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
        <span className="text-5xl">📡</span>
        <p className="text-neutral-400 text-sm">
          No add-ons installed.
          <br />
          Go to Add-ons and install one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-6 overflow-y-auto h-full">
      {enabledAddons.flatMap((addon) =>
        (addon.manifest!.catalogs ?? []).map((cat) => (
          <CatalogRow
            key={`${addon.transportUrl}|${cat.type}|${cat.id}`}
            transportUrl={addon.transportUrl} // ← this must be here
            catalogType={cat.type}
            catalogId={cat.id}
            label={`${addon.manifest!.name} — ${cat.name}`}
            onSelect={(item, url) => setSelected({ item, transportUrl: url })}
          />
        )),
      )}
    </div>
  );
}
