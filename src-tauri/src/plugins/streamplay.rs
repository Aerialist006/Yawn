use reqwest::Client;
use serde::Deserialize;
use serde_json::Value;
use crate::plugins::types::*;

const TMDB_BASE: &str = "https://api.themoviedb.org/3";
const IMG_BASE: &str = "https://image.tmdb.org/t/p/original";

fn img(path: &Option<String>) -> Option<String> {
    path.as_ref().map(|p| {
        if p.starts_with('/') { format!("{}{}", IMG_BASE, p) } else { p.clone() }
    })
}

// ─── TMDB response types ────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct TmdbSearchResult {
    id: Option<i64>,
    title: Option<String>,
    name: Option<String>,
    media_type: Option<String>,
    poster_path: Option<String>,
    backdrop_path: Option<String>,
    overview: Option<String>,
    release_date: Option<String>,
    first_air_date: Option<String>,
    vote_average: Option<f64>,
    genre_ids: Option<Vec<i64>>,
}

#[derive(Debug, Deserialize)]
struct TmdbSearchResponse {
    results: Option<Vec<TmdbSearchResult>>,
}

#[derive(Debug, Deserialize)]
struct TmdbGenre {
    name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TmdbExternalIds {
    imdb_id: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TmdbEpisode {
    id: Option<i64>,
    name: Option<String>,
    overview: Option<String>,
    season_number: Option<i64>,
    episode_number: Option<i64>,
    air_date: Option<String>,
    still_path: Option<String>,
    runtime: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct TmdbSeason {
    season_number: Option<i64>,
    name: Option<String>,
    episodes: Option<Vec<TmdbEpisode>>,
}

#[derive(Debug, Deserialize)]
struct TmdbDetailMovie {
    id: Option<i64>,
    title: Option<String>,
    poster_path: Option<String>,
    backdrop_path: Option<String>,
    overview: Option<String>,
    release_date: Option<String>,
    vote_average: Option<f64>,
    genres: Option<Vec<TmdbGenre>>,
    external_ids: Option<TmdbExternalIds>,
    runtime: Option<i64>,
}

#[derive(Debug, Deserialize)]
struct TmdbDetailTv {
    id: Option<i64>,
    name: Option<String>,
    poster_path: Option<String>,
    backdrop_path: Option<String>,
    overview: Option<String>,
    first_air_date: Option<String>,
    vote_average: Option<f64>,
    genres: Option<Vec<TmdbGenre>>,
    external_ids: Option<TmdbExternalIds>,
    seasons: Option<Vec<TmdbSeasonSummary>>,
}

#[derive(Debug, Clone, Deserialize)]
struct TmdbSeasonSummary {
    season_number: Option<i64>,
    name: Option<String>,
}

// ─── Helpers ────────────────────────────────────────────────────────────────

fn year_from(date: &Option<String>) -> Option<String> {
    date.as_ref()
        .and_then(|d|
            d
                .split('-')
                .next()
                .map(|s| s.to_string())
        )
        .filter(|s| !s.is_empty())
}

// ─── Public API ─────────────────────────────────────────────────────────────

pub async fn search(
    client: &Client,
    api_key: &str,
    query: &str
) -> Result<Vec<YawnMediaItem>, String> {
    let url = format!(
        "{}/search/multi?api_key={}&query={}&include_adult=false",
        TMDB_BASE,
        api_key,
        urlencoding::encode(query)
    );

    let resp = client
        .get(&url)
        .send().await
        .map_err(|e| format!("TMDB search failed: {e}"))?
        .json::<TmdbSearchResponse>().await
        .map_err(|e| format!("TMDB search parse failed: {e}"))?;

    let items = resp.results
        .unwrap_or_default()
        .into_iter()
        .filter_map(|r| {
            let media_type = r.media_type.as_deref().unwrap_or("movie");
            if media_type == "person" {
                return None;
            }
            let id = r.id?;
            let title = r.title.or(r.name)?;
            Some(YawnMediaItem {
                id: id.to_string(),
                imdb_id: None,
                title,
                media_type: media_type.to_string(),
                poster: img(&r.poster_path),
                backdrop: img(&r.backdrop_path),
                overview: r.overview,
                year: year_from(&r.release_date.or(r.first_air_date)),
                rating: r.vote_average,
                genres: None,
            })
        })
        .take(20)
        .collect();

    Ok(items)
}

pub async fn get_meta(
    client: &Client,
    api_key: &str,
    tmdb_id: &str,
    media_type: &str
) -> Result<YawnMeta, String> {
    if media_type == "movie" {
        get_movie_meta(client, api_key, tmdb_id).await
    } else {
        get_tv_meta(client, api_key, tmdb_id).await
    }
}

async fn get_movie_meta(client: &Client, api_key: &str, tmdb_id: &str) -> Result<YawnMeta, String> {
    let url = format!(
        "{}/movie/{}?api_key={}&append_to_response=external_ids",
        TMDB_BASE,
        tmdb_id,
        api_key
    );

    let detail: TmdbDetailMovie = client
        .get(&url)
        .send().await
        .map_err(|e| e.to_string())?
        .json().await
        .map_err(|e| format!("Movie meta parse: {e}"))?;

    let item = YawnMediaItem {
        id: detail.id.map(|i| i.to_string()).unwrap_or_default(),
        imdb_id: detail.external_ids.as_ref().and_then(|e| e.imdb_id.clone()),
        title: detail.title.unwrap_or_default(),
        media_type: "movie".to_string(),
        poster: img(&detail.poster_path),
        backdrop: img(&detail.backdrop_path),
        overview: detail.overview,
        year: year_from(&detail.release_date),
        rating: detail.vote_average,
        genres: detail.genres.map(|g|
            g
                .into_iter()
                .filter_map(|x| x.name)
                .collect()
        ),
    };

    Ok(YawnMeta { item, seasons: None })
}

async fn get_tv_meta(client: &Client, api_key: &str, tmdb_id: &str) -> Result<YawnMeta, String> {
    let url = format!(
        "{}/tv/{}?api_key={}&append_to_response=external_ids",
        TMDB_BASE,
        tmdb_id,
        api_key
    );

    let detail: TmdbDetailTv = client
        .get(&url)
        .send().await
        .map_err(|e| e.to_string())?
        .json().await
        .map_err(|e| format!("TV meta parse: {e}"))?;

    // Fetch all seasons concurrently
    let season_summaries = detail.seasons.clone().unwrap_or_default();
    let mut seasons = vec![];

    for s in &season_summaries {
        let snum = s.season_number.unwrap_or(0);
        if snum == 0 {
            continue;
        } // skip specials

        let season_url = format!(
            "{}/tv/{}/season/{}?api_key={}",
            TMDB_BASE,
            tmdb_id,
            snum,
            api_key
        );

        let season_resp: Result<TmdbSeason, _> = client
            .get(&season_url)
            .send().await
            .map_err(|e| e.to_string())?
            .json().await;

        if let Ok(season_data) = season_resp {
            let episodes = season_data.episodes
                .unwrap_or_default()
                .into_iter()
                .map(|ep| {
                    YawnEpisode {
                        id: ep.id.map(|i| i.to_string()).unwrap_or_default(),
                        title: ep.name,
                        overview: ep.overview,
                        season: ep.season_number.unwrap_or(snum),
                        episode: ep.episode_number.unwrap_or(0),
                        air_date: ep.air_date,
                        still: img(&ep.still_path),
                        runtime: ep.runtime,
                    }
                })
                .collect();

            seasons.push(YawnSeason {
                number: snum,
                name: s.name.clone(),
                episodes,
            });
        }
    }

    let item = YawnMediaItem {
        id: detail.id.map(|i| i.to_string()).unwrap_or_default(),
        imdb_id: detail.external_ids.as_ref().and_then(|e| e.imdb_id.clone()),
        title: detail.name.unwrap_or_default(),
        media_type: "tv".to_string(),
        poster: img(&detail.poster_path),
        backdrop: img(&detail.backdrop_path),
        overview: detail.overview,
        year: year_from(&detail.first_air_date),
        rating: detail.vote_average,
        genres: detail.genres.map(|g|
            g
                .into_iter()
                .filter_map(|x| x.name)
                .collect()
        ),
    };

    Ok(YawnMeta { item, seasons: Some(seasons) })
}

pub async fn get_streams(
    client: &Client,
    imdb_id: &str,
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Result<StreamResult, String> {
    let mut streams = vec![];
    let mut subtitles = vec![];

    // Collect from all providers concurrently
    let providers: Vec<
        (
            &str,
            Box<
                dyn (Fn() -> std::pin::Pin<
                    Box<dyn std::future::Future<Output = Vec<YawnStream>> + Send>
                >) +
                    Send +
                    Sync
            >,
        )
    > = vec![];

    // Provider 1: vidsrc.to (most reliable free source)
    if let Ok(s) = invoke_vidsrc(client, imdb_id, season, episode).await {
        streams.extend(s);
    }

    // Provider 2: videasy
    if let Ok(s) = invoke_videasy(client, tmdb_id, imdb_id, media_type, season, episode).await {
        streams.extend(s);
    }

    // Provider 3: vidlink
    if let Ok(s) = invoke_vidlink(client, tmdb_id, media_type, season, episode).await {
        streams.extend(s);
    }

    // Provider 4: 2embed
    if let Ok(s) = invoke_2embed(client, imdb_id, season, episode).await {
        streams.extend(s);
    }

    // Subtitles from OpenSubtitles Stremio
    if let Ok(subs) = invoke_opensubtitles(client, imdb_id, season, episode).await {
        subtitles.extend(subs);
    }

    Ok(StreamResult { streams, subtitles })
}

// ─── Provider: vidsrc.to ────────────────────────────────────────────────────

async fn invoke_vidsrc(
    client: &Client,
    imdb_id: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Result<Vec<YawnStream>, String> {
    let url = match (season, episode) {
        (Some(s), Some(e)) => format!("https://vidsrc.to/embed/tv/{}/{}/{}", imdb_id, s, e),
        _ => format!("https://vidsrc.to/embed/movie/{}", imdb_id),
    };

    Ok(
        vec![YawnStream {
            url,
            name: "VidSrc".to_string(),
            quality: Some("1080p".to_string()),
            stream_type: "embed".to_string(),
            headers: None,
        }]
    )
}

// ─── Provider: videasy ──────────────────────────────────────────────────────

async fn invoke_videasy(
    client: &Client,
    tmdb_id: &str,
    imdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Result<Vec<YawnStream>, String> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) =>
            format!("https://player.videasy.net/tv/{}/{}/{}", tmdb_id, s, e),
        _ => format!("https://player.videasy.net/movie/{}", tmdb_id),
    };

    Ok(
        vec![YawnStream {
            url,
            name: "Videasy".to_string(),
            quality: Some("1080p".to_string()),
            stream_type: "embed".to_string(),
            headers: None,
        }]
    )
}

// ─── Provider: vidlink ──────────────────────────────────────────────────────

async fn invoke_vidlink(
    client: &Client,
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Result<Vec<YawnStream>, String> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) => format!("https://vidlink.pro/tv/{}/{}/{}", tmdb_id, s, e),
        _ => format!("https://vidlink.pro/movie/{}", tmdb_id),
    };

    Ok(
        vec![YawnStream {
            url,
            name: "VidLink".to_string(),
            quality: Some("1080p".to_string()),
            stream_type: "embed".to_string(),
            headers: None,
        }]
    )
}

// ─── Provider: 2embed ───────────────────────────────────────────────────────

async fn invoke_2embed(
    client: &Client,
    imdb_id: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Result<Vec<YawnStream>, String> {
    let url = match (season, episode) {
        (Some(s), Some(e)) => format!("https://www.2embed.cc/embedtv/{}&s={}&e={}", imdb_id, s, e),
        _ => format!("https://www.2embed.cc/embed/{}", imdb_id),
    };

    Ok(
        vec![YawnStream {
            url,
            name: "2Embed".to_string(),
            quality: Some("1080p".to_string()),
            stream_type: "embed".to_string(),
            headers: None,
        }]
    )
}

// ─── Subtitles: OpenSubtitles via Stremio ───────────────────────────────────

#[derive(Debug, Deserialize)]
struct SubtitleItem {
    lang: Option<String>,
    url: Option<String>,
}

#[derive(Debug, Deserialize)]
struct SubtitleResponse {
    subtitles: Option<Vec<SubtitleItem>>,
}

async fn invoke_opensubtitles(
    client: &Client,
    imdb_id: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Result<Vec<YawnSubtitle>, String> {
    let url = match (season, episode) {
        (Some(s), Some(e)) =>
            format!(
                "https://opensubtitles-v3.strem.io/subtitles/series/{}:{}:{}.json",
                imdb_id,
                s,
                e
            ),
        _ => format!("https://opensubtitles-v3.strem.io/subtitles/movie/{}.json", imdb_id),
    };

    let resp = client
        .get(&url)
        .send().await
        .map_err(|e| e.to_string())?
        .json::<SubtitleResponse>().await
        .map_err(|e| e.to_string())?;

    let subs = resp.subtitles
        .unwrap_or_default()
        .into_iter()
        .filter_map(|s| {
            Some(YawnSubtitle {
                url: s.url?,
                language: s.lang.unwrap_or_else(|| "Unknown".to_string()),
            })
        })
        .take(30)
        .collect();

    Ok(subs)
}
