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

export interface YawnStream {
  url: string;
  name: string;
  quality?: string;
  streamType: string; // "embed" | "hls" | "mp4"
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

export interface SubtitleTrack {
  label: string;
  language: string;
  url: string; // .vtt or .srt URL, or blob: for manual import
  isLocal?: boolean;
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

export interface YawnShelfItem {
  id: string;
  tmdbId?: string;
  imdbId?: string;
  title: string;
  poster?: string;
  backdrop?: string;
  year?: string;
  type: "movie" | "series" | "anime";
  rating?: string;
  overview?: string;
}

export interface YawnShelf {
  id: string;
  title: string;
  items: YawnShelfItem[];
}

export interface YawnHomepage {
  hero?: YawnShelfItem;
  shelves: YawnShelf[];
}
