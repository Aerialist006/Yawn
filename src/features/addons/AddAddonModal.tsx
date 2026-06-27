import { useState } from "react";

interface Props {
  onInstall: (url: string) => Promise<void>;
  onClose: () => void;
}

export function AddAddonModal({ onInstall, onClose }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onInstall(url.trim());
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-md flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white font-semibold text-lg">Install Add-on</h2>
        <p className="text-neutral-500 text-sm">Paste a Stremio add-on manifest URL or transport URL.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            autoFocus
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://v3-cinemeta.strem.io/manifest.json"
            className="bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-500 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-white text-black text-sm font-semibold px-5 py-2 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Installing…" : "Install"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}