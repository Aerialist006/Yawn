import { useEffect, useState } from "react";
import { ArrowLeft, Star, Play, WarningCircle } from "@phosphor-icons/react";
import { cachedFetch } from "../../state/tmdbCache";
import type { YawnShelfItem } from "../../types/yawn";

interface TmdbDetail {
  title?: string;
  name?: string;
  overview?: string;
  backdrop_path?: string;
  poster_path?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
  genres?: { id: number; name: string }[];
  runtime?: number;
  number_of_seasons?: number;
  status?: string;
  seasons?: TmdbSeason[];
  success?: boolean;
  status_message?: string;
}

interface TmdbSeason {
  season_number: number;
  name: string;
  episode_count: number;
  poster_path?: string;
}

interface TmdbEpisode {
  episode_number: number;
  name: string;
  overview?: string;
  still_path?: string;
  runtime?: number;
}

interface TmdbSeasonDetail {
  episodes?: TmdbEpisode[];
}

interface TmdbFindResult {
  movie_results?: { id: number }[];
  tv_results?: { id: number }[];
}

export interface StreamArgs {
  tmdbId: string;
  imdbId?: string;
  mediaType: "movie" | "tv";
  title: string;
  season?: number;
  episode?: number;
  pluginId: string;
  poster?: string;
}

interface Props {
  item: YawnShelfItem;
  pluginId: string;
  onBack: () => void;
  onPlay: (args: StreamArgs) => void;
}

const IMG = "https://image.tmdb.org/t/p";

async function tmdbFetch<T>(path: string): Promise<T> {
  const key = (import.meta as any).env?.VITE_TMDB_KEY ?? "";
  if (!key) throw new Error("VITE_TMDB_KEY is not set in .env");
  return cachedFetch<T>(`tmdb_${path}`, async () => {
    const res = await fetch(
      `https://api.themoviedb.org/3${path}?api_key=${key}`,
    );
    const json = await res.json();
    if (json.success === false)
      throw new Error(json.status_message ?? "TMDB error");
    return json as T;
  });
}

export function MetaPage({ item, pluginId, onBack, onPlay }: Props) {
  const [detail, setDetail] = useState<TmdbDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<TmdbEpisode[]>([]);
  const [loadingEps, setLoadingEps] = useState(false);

  const isMovie = item.type === "movie";
  const rawId = item.tmdbId ?? item.id;
  const isImdbId = rawId.startsWith("tt");

  const [tmdbId, setTmdbId] = useState<string>(isImdbId ? "" : rawId);

  // Step 1: resolve IMDB id → TMDB id if needed
  useEffect(() => {
    if (!isImdbId) {
      setTmdbId(rawId);
      return;
    }
    setLoading(true);
    setError(null);
    const mediaType = isMovie ? "movie" : "tv";
    tmdbFetch<TmdbFindResult>(`/find/${rawId}?external_source=imdb_id`)
      .then((res) => {
        const result =
          mediaType === "movie" ? res.movie_results?.[0] : res.tv_results?.[0];
        if (result?.id) {
          setTmdbId(String(result.id));
        } else {
          setError(`No TMDB match found for ${rawId}`);
          setLoading(false);
        }
      })
      .catch((e: unknown) => {
        setError(String(e));
        setLoading(false);
      });
  }, [rawId, isImdbId, isMovie]);

  // Step 2: fetch detail once we have a real tmdbId
  useEffect(() => {
    if (!tmdbId) return;
    setLoading(true);
    setError(null);
    setDetail(null);
    tmdbFetch<TmdbDetail>(isMovie ? `/movie/${tmdbId}` : `/tv/${tmdbId}`)
      .then((d) => {
        setDetail(d);
        if (!isMovie && d.seasons?.length) {
          const firstReal = d.seasons.find((s) => s.season_number > 0);
          setSelectedSeason(firstReal?.season_number ?? 1);
        }
      })
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [tmdbId, isMovie]);

  // Step 3: fetch episodes when season changes
  useEffect(() => {
    if (isMovie || !tmdbId || !detail) return;
    setLoadingEps(true);
    setEpisodes([]);
    tmdbFetch<TmdbSeasonDetail>(`/tv/${tmdbId}/season/${selectedSeason}`)
      .then((d) => setEpisodes(d.episodes ?? []))
      .catch(console.error)
      .finally(() => setLoadingEps(false));
  }, [tmdbId, selectedSeason, isMovie, detail]);

  const title = detail?.title ?? detail?.name ?? item.title;
  const backdrop = detail?.backdrop_path
    ? `${IMG}/w1280${detail.backdrop_path}`
    : item.backdrop;
  const poster = detail?.poster_path
    ? `${IMG}/w342${detail.poster_path}`
    : item.poster;
  const year = (
    detail?.release_date ??
    detail?.first_air_date ??
    item.year ??
    ""
  ).slice(0, 4);
  const rating = detail?.vote_average
    ? detail.vote_average.toFixed(1)
    : item.rating;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950">
        <div className="w-12 h-12 border-[3px] border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 gap-4 px-8 text-center">
        <WarningCircle size={48} className="text-red-500" />
        <p className="text-white font-bold text-lg">Failed to load details</p>
        <p className="text-neutral-500 text-sm max-w-sm">{error}</p>
        <button
          onClick={onBack}
          className="mt-2 flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-y-auto">
      {/* Backdrop */}
      <div className="relative w-full h-[50vh]">
        {backdrop && (
          <img
            src={backdrop}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-neutral-950/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 px-4 py-2 rounded-xl transition-all text-sm font-semibold backdrop-blur"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* Content */}
      <div className="px-8 -mt-36 relative z-10">
        <div className="flex gap-8 items-end mb-8">
          {poster && (
            <img
              src={poster}
              alt={title}
              className="w-44 rounded-2xl shadow-2xl shrink-0 border border-white/10 hidden sm:block"
            />
          )}
          <div className="flex flex-col gap-3 pb-2 min-w-0">
            <h1 className="text-4xl font-black leading-tight">{title}</h1>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              {rating && (
                <span className="flex items-center gap-1 text-yellow-400 font-bold">
                  <Star size={14} weight="fill" /> {rating}
                </span>
              )}
              {year && <span className="text-neutral-400">{year}</span>}
              {detail?.runtime && (
                <span className="text-neutral-400">{detail.runtime} min</span>
              )}
              {detail?.number_of_seasons && (
                <span className="text-neutral-400">
                  {detail.number_of_seasons} Season
                  {detail.number_of_seasons > 1 ? "s" : ""}
                </span>
              )}
              {detail?.status && (
                <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-md text-xs">
                  {detail.status}
                </span>
              )}
            </div>
            {detail?.genres && detail.genres.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {detail.genres.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs bg-white/5 border border-white/10 text-neutral-300 px-3 py-1 rounded-full"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
            {(detail?.overview ?? item.overview) && (
              <p className="text-neutral-400 text-sm leading-relaxed max-w-2xl">
                {detail?.overview ?? item.overview}
              </p>
            )}
            {isMovie && (
              <button
                onClick={() =>
                  onPlay({
                    tmdbId,
                    imdbId: isImdbId ? rawId : item.imdbId,
                    mediaType: "movie",
                    title: title ?? "",
                    pluginId,
                    poster: poster ?? undefined,
                  })
                }
                className="mt-2 w-fit flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl text-base transition-colors"
              >
                <Play size={18} weight="fill" /> Watch Now
              </button>
            )}
          </div>
        </div>

        {/* TV seasons + episodes */}
        {!isMovie && detail?.seasons && (
          <div className="mt-2 pb-12">
            <div className="flex gap-2 flex-wrap mb-6">
              {detail.seasons
                .filter((s) => s.season_number > 0)
                .map((s) => (
                  <button
                    key={s.season_number}
                    onClick={() => setSelectedSeason(s.season_number)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      selectedSeason === s.season_number
                        ? "bg-red-600 text-white"
                        : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
            </div>

            {loadingEps ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : episodes.length === 0 ? (
              <p className="text-neutral-600 text-sm py-8 text-center">
                No episodes found.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {episodes.map((ep) => (
                  <button
                    key={ep.episode_number}
                    onClick={() =>
                      onPlay({
                        tmdbId,
                        imdbId: isImdbId ? rawId : item.imdbId,
                        mediaType: "tv",
                        title: title ?? "",
                        season: selectedSeason,
                        episode: ep.episode_number,
                        pluginId,
                        poster: poster ?? undefined,
                      })
                    }
                    className="flex items-center gap-4 bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-red-500/30 rounded-xl p-4 text-left transition-all group"
                  >
                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                      {ep.still_path ? (
                        <img
                          src={`${IMG}/w300${ep.still_path}`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-600">
                          <Play size={20} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-neutral-500 text-sm font-mono shrink-0">
                          E{String(ep.episode_number).padStart(2, "0")}
                        </span>
                        <span className="text-white font-semibold text-sm truncate group-hover:text-red-400 transition-colors">
                          {ep.name}
                        </span>
                        {ep.runtime && (
                          <span className="text-neutral-600 text-xs ml-auto shrink-0">
                            {ep.runtime} min
                          </span>
                        )}
                      </div>
                      {ep.overview && (
                        <p className="text-neutral-500 text-xs line-clamp-2 leading-relaxed">
                          {ep.overview}
                        </p>
                      )}
                    </div>
                    <Play
                      size={20}
                      weight="fill"
                      className="text-neutral-600 group-hover:text-red-500 shrink-0 transition-colors"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
