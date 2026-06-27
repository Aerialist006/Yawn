export interface YawnMediaItem {
  id: string;
  imdbId?: string;
  title: string;
  mediaType: "movie" | "tv";
  poster?: string;
  backdrop?: string;
  overview?: string;
  year?: string;
  rating?: number;
  genres?: string[];
}

export interface YawnEpisode {
  id: string;
  title?: string;
  overview?: string;
  season: number;
  episode: number;
  airDate?: string;
  still?: string;
  runtime?: number;
}

export interface YawnSeason {
  number: number;
  name?: string;
  episodes: YawnEpisode[];
}

export interface YawnMeta {
  item: YawnMediaItem;
  seasons?: YawnSeason[];
}

export interface YawnStream {
  url: string;
  name: string;
  quality?: string;
  streamType: "hls" | "mp4" | "dash" | "embed";
  headers?: Record<string, string>;
}

export interface YawnSubtitle {
  url: string;
  language: string;
}

export interface StreamResult {
  streams: YawnStream[];
  subtitles: YawnSubtitle[];
}
