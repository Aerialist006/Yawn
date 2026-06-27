import { useEffect, useState } from "react";
import { api } from "../../lib/invoke";
import { Spinner } from "../../components/Spinner";
import type { StremioMetaItem, StremioStream } from "../../types/stremio";

interface Props {
  transportUrl: string;
  metaType: string;
  metaId: string;
  onBack: () => void;
}

export function MetaPage({ transportUrl, metaType, metaId, onBack }: Props) {
  const [meta, setMeta] = useState<StremioMetaItem | null>(null);
  const [streams, setStreams] = useState<StremioStream[] | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingMeta(true);
    api.getMeta(transportUrl, metaType, metaId)
      .then(setMeta)
      .catch((e) => setError(String(e)))
      .finally(() => setLoadingMeta(false));
  }, [metaId]);

  const handleWatch = () => {
    if (!meta) return;
    setLoadingStreams(true);
    api.getStreams(transportUrl, metaType, metaId)
      .then(setStreams)
      .catch((e) => setError(String(e)))
      .finally(() => setLoadingStreams(false));
  };

  if (loadingMeta) return <Spinner />;
  if (error) return (
    <div className="p-6 text-red-500">{error}</div>
  );
  if (!meta) return null;

  return (
    <div className="relative flex flex-col h-full overflow-y-auto">
      {/* Background art */}
      {meta.background && (
        <div
          className="absolute inset-0 bg-cover bg-top opacity-10 pointer-events-none"
          style={{ backgroundImage: `url(${meta.background})` }}
        />
      )}

      {/* Back */}
      <button
        onClick={onBack}
        className="relative z-10 self-start m-6 text-neutral-400 hover:text-white text-sm transition-colors"
      >
        ← Back
      </button>

      {/* Content */}
      <div className="relative z-10 flex gap-8 px-6 pb-6">
        {/* Poster */}
        {meta.poster && (
          <img
            src={meta.poster}
            alt={meta.name}
            className="w-44 rounded-xl shrink-0 object-cover shadow-2xl"
          />
        )}

        <div className="flex flex-col gap-3 pt-2">
          <h1 className="text-white text-3xl font-bold">{meta.name}</h1>

          <div className="flex items-center gap-3 text-sm text-neutral-400">
            {meta.releaseInfo && <span>{meta.releaseInfo}</span>}
            {meta.imdbRating && (
              <span className="text-yellow-400">★ {meta.imdbRating}</span>
            )}
            {meta.genres && meta.genres.length > 0 && (
              <span>{meta.genres.slice(0, 3).join(" · ")}</span>
            )}
          </div>

          {meta.description && (
            <p className="text-neutral-300 text-sm leading-relaxed max-w-xl">
              {meta.description}
            </p>
          )}

          <button
            onClick={handleWatch}
            disabled={loadingStreams}
            className="mt-2 self-start bg-white text-black font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {loadingStreams ? "Loading streams…" : "▶ Watch"}
          </button>

          {/* Streams */}
          {streams && streams.length === 0 && (
            <p className="text-neutral-500 text-sm">No streams found.</p>
          )}
          {streams && streams.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-neutral-400 text-xs uppercase tracking-widest">Streams</p>
              {streams.map((s, i) => (
                <a
                  key={i}
                  href={s.url ?? s.externalUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg px-4 py-3 transition-colors"
                >
                  <span className="text-white text-sm font-medium">{s.name ?? `Stream ${i + 1}`}</span>
                  {s.title && (
                    <span className="text-neutral-500 text-xs">{s.title}</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Episodes */}
      {meta.videos && meta.videos.length > 0 && (
        <div className="relative z-10 flex flex-col gap-2 px-6 pb-8">
          <p className="text-neutral-400 text-xs uppercase tracking-widest mb-1">Episodes</p>
          {meta.videos.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-4 bg-neutral-800/60 rounded-lg px-4 py-3"
            >
              {v.thumbnail && (
                <img src={v.thumbnail} alt={v.title ?? ""} className="w-24 rounded object-cover shrink-0" loading="lazy" />
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-white text-sm font-medium">
                  {v.season != null && v.episode != null
                    ? `S${v.season} E${v.episode} — `
                    : ""}
                  {v.title ?? v.name}
                </span>
                {v.overview && (
                  <span className="text-neutral-500 text-xs line-clamp-2">{v.overview}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}