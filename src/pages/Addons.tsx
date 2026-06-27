import { useState, useEffect } from "react";
import { useStore } from "../state/store";
import { AddonCard } from "../features/addons/AddonCard";
import { AddAddonModal } from "../features/addons/AddAddonModal";

export function AddonsPage() {
  const { addons, loadAddons, installAddon, uninstallAddon } = useStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadAddons();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold text-xl">Add-ons</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-white text-black text-sm font-semibold px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors"
        >
          + Install
        </button>
      </div>

      {addons.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
          <span className="text-4xl">⊕</span>
          <p className="text-neutral-400 text-sm">No add-ons installed yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-white underline text-sm hover:text-neutral-300 transition-colors"
          >
            Install your first add-on
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {addons.map((addon) => (
          <AddonCard
            key={addon.transportUrl}
            addon={addon}
            onUninstall={uninstallAddon}
          />
        ))}
      </div>

      {showModal && (
        <AddAddonModal
          onInstall={installAddon}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
