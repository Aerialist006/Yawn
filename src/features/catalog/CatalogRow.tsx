import { useEffect, useState } from "react";
import { useStore } from "../../state/store";
import { MediaCard } from "./MediaCard";
import { Spinner } from "../../components/Spinner";
import type { StremioMetaPreview } from "../../types/stremio";

interface Props {
  transportUrl: string;
  catalogType: string;
  catalogId: string;
  label: string;
  onSelect: (item: StremioMetaPreview, transportUrl: string) => void;
}

export function CatalogRow({
  transportUrl,
  catalogType,
  catalogId,
  label,
  onSelect,
}: Props) {
  const { catalog, loadCatalog } = useStore();
  const key = `${transportUrl}|${catalogType}|${catalogId}`;
  const items = catalog[key];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (items) return;
    setLoading(true);
    loadCatalog(transportUrl, catalogType, catalogId)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [key]);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-neutral-200 font-semibold text-base px-6">{label}</h2>
      {loading && <Spinner />}
      {error && <p className="text-red-500 text-sm px-6">{error}</p>}
      {items && items.length === 0 && (
        <p className="text-neutral-600 text-sm px-6">Nothing here yet.</p>
      )}
      {items && items.length > 0 && (
        <div className="flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-hide">
          {items.map((item) => (
            <div key={item.id} className="w-36 shrink-0">
              <MediaCard
                item={item}
                onClick={(i) => onSelect(i, transportUrl)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
