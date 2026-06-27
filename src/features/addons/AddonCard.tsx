import type { AddonDefinition } from "../../types/stremio";

interface Props {
  addon: AddonDefinition;
  onUninstall: (url: string) => void;
}

export function AddonCard({ addon, onUninstall }: Props) {
  const m = addon.manifest;
  return (
    <div className="flex items-center gap-4 bg-neutral-800 rounded-xl px-4 py-4">
      {m?.logo ? (
        <img src={m.logo} alt={m.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-neutral-700 shrink-0 flex items-center justify-center text-neutral-400 text-xl">
          ⊕
        </div>
      )}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-white font-semibold text-sm truncate">{m?.name ?? addon.transportUrl}</span>
        {m?.description && (
          <span className="text-neutral-500 text-xs line-clamp-1">{m.description}</span>
        )}
        <div className="flex gap-2 mt-1 flex-wrap">
          {m?.types.map((t) => (
            <span key={t} className="text-xs bg-neutral-700 text-neutral-300 px-2 py-0.5 rounded-full">
              {t}
            </span>
          ))}
        </div>
      </div>
      <button
        onClick={() => onUninstall(addon.transportUrl)}
        className="text-neutral-600 hover:text-red-400 text-xs transition-colors shrink-0"
      >
        Remove
      </button>
    </div>
  );
}