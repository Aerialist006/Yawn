use reqwest::Client;
use serde::Deserialize;
use crate::plugins::types::*;

const TMDB_BASE: &str = "https://api.themoviedb.org/3";
const IMG_BASE: &str = "https://image.tmdb.org/t/p/original";

fn img(path: &Option<String>) -> Option<String> {
    path.as_ref().map(|p| {
        if p.starts_with('/') { format!("{}{}", IMG_BASE, p) } else { p.clone() }
    })
}

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

fn make_embed(name: &str, url: &str) -> YawnStream {
    YawnStream {
        url: url.to_string(),
        name: name.to_string(),
        quality: Some("1080p".to_string()),
        stream_type: "embed".to_string(),
        headers: None,
    }
}

// ─── TMDB types ──────────────────────────────────────────────────────────────

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

// ─── Videasy extractor types ──────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
struct VideasySource {
    file: Option<String>,
    #[serde(rename = "type")]
    kind: Option<String>,
}

#[derive(Debug, Deserialize)]
struct VideasyResponse {
    sources: Option<Vec<VideasySource>>,
}

// ─── Public API ──────────────────────────────────────────────────────────────

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
        .map_err(|e| format!("TMDB parse failed: {e}"))?;

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

    let season_summaries = detail.seasons.unwrap_or_default();
    let mut seasons = vec![];

    for s in &season_summaries {
        let snum = s.season_number.unwrap_or(0);
        if snum == 0 {
            continue;
        }

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
                .map(|ep| YawnEpisode {
                    id: ep.id.map(|i| i.to_string()).unwrap_or_default(),
                    title: ep.name,
                    overview: ep.overview,
                    season: ep.season_number.unwrap_or(snum),
                    episode: ep.episode_number.unwrap_or(0),
                    air_date: ep.air_date,
                    still: img(&ep.still_path),
                    runtime: ep.runtime,
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

// ─── Videasy native extractor ─────────────────────────────────────────────────

pub async fn extract_videasy(
    client: &Client,
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Result<Option<String>, String> {
    let api_url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) =>
            format!(
                "https://player.videasy.net/api/tv/{}/{}/{}", // ← .net not .to
                tmdb_id,
                s,
                e
            ),
        _ => format!("https://player.videasy.net/api/movie/{}", tmdb_id),
    };

    println!("[Videasy] Fetching: {}", api_url);

    let bytes = client
        .get(&api_url)
        .header("Referer", "https://player.videasy.net/")
        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        .send().await
        .map_err(|e| format!("Videasy fetch failed: {e}"))?
        .bytes().await
        .map_err(|e| format!("Videasy read failed: {e}"))?;

    println!("[Videasy] Raw response: {}", String::from_utf8_lossy(&bytes));

    let resp = serde_json
        ::from_slice::<VideasyResponse>(&bytes)
        .map_err(|e| format!("Videasy parse failed: {e}"))?;

    let url = resp.sources
        .unwrap_or_default()
        .into_iter()
        .find(|s| (s.kind.as_deref() == Some("hls") || s.file.is_some()))
        .and_then(|s| s.file);

    println!("[Videasy] Resolved URL: {:?}", url);

    Ok(url)
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

    let embed_streams: Vec<Option<YawnStream>> = vec![
        invoke_videasy(tmdb_id, media_type, season, episode),
        invoke_vidsrc(imdb_id, season, episode),
        invoke_vidsrc_me(imdb_id, season, episode),
        invoke_vidsrc_pro(tmdb_id, media_type, season, episode),
        invoke_vidsrc_cc(tmdb_id, media_type, season, episode),
        invoke_vidsrc_xyz(imdb_id, season, episode),
        invoke_vidsrc_icu(tmdb_id, media_type, season, episode),
        invoke_vidlink(tmdb_id, media_type, season, episode),
        invoke_2embed(imdb_id, season, episode),
        invoke_embedsu(imdb_id, season, episode),
        invoke_multiembed(imdb_id, season, episode),
        invoke_smashystream(imdb_id, season, episode),
        invoke_autoembed(tmdb_id, media_type, season, episode),
        invoke_111movies(tmdb_id, media_type, season, episode),
        invoke_moviesapi(imdb_id, season, episode),
        invoke_rive(tmdb_id, media_type, season, episode),
        invoke_nontongo(imdb_id, media_type, season, episode),
        invoke_primewire(imdb_id, season, episode),
        invoke_pressplay(tmdb_id, media_type, season, episode),
        invoke_superembed(imdb_id, media_type, season, episode)
    ];

    for stream in embed_streams.into_iter().flatten() {
        streams.push(stream);
    }

    if let Ok(subs) = invoke_opensubtitles(client, imdb_id, season, episode).await {
        subtitles.extend(subs);
    }

    Ok(StreamResult { streams, subtitles })
}

// ─── Embed providers ─────────────────────────────────────────────────────────

fn invoke_videasy(
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) =>
            format!("https://player.videasy.net/tv/{}/{}/{}", tmdb_id, s, e),
        _ => format!("https://player.videasy.net/movie/{}", tmdb_id),
    };
    Some(make_embed("Videasy", &url))
}

fn invoke_vidsrc(imdb_id: &str, season: Option<i64>, episode: Option<i64>) -> Option<YawnStream> {
    let url = match (season, episode) {
        (Some(s), Some(e)) => format!("https://vidsrc.to/embed/tv/{}/{}/{}", imdb_id, s, e),
        _ => format!("https://vidsrc.to/embed/movie/{}", imdb_id),
    };
    Some(make_embed("VidSrc", &url))
}

fn invoke_vidsrc_me(
    imdb_id: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (season, episode) {
        (Some(s), Some(e)) =>
            format!("https://vidsrc.me/embed/tv?imdb={}&season={}&episode={}", imdb_id, s, e),
        _ => format!("https://vidsrc.me/embed/movie?imdb={}", imdb_id),
    };
    Some(make_embed("VidSrc.me", &url))
}

fn invoke_vidsrc_pro(
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) => format!("https://vidsrc.pro/embed/tv/{}/{}/{}", tmdb_id, s, e),
        _ => format!("https://vidsrc.pro/embed/movie/{}", tmdb_id),
    };
    Some(make_embed("VidSrc.pro", &url))
}

fn invoke_vidsrc_cc(
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) =>
            format!("https://vidsrc.cc/v2/embed/tv/{}/{}/{}", tmdb_id, s, e),
        _ => format!("https://vidsrc.cc/v2/embed/movie/{}", tmdb_id),
    };
    Some(make_embed("VidSrc.cc", &url))
}

fn invoke_vidsrc_xyz(
    imdb_id: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (season, episode) {
        (Some(s), Some(e)) =>
            format!("https://vidsrc.xyz/embed/tv?imdb={}&season={}&episode={}", imdb_id, s, e),
        _ => format!("https://vidsrc.xyz/embed/movie?imdb={}", imdb_id),
    };
    Some(make_embed("VidSrc.xyz", &url))
}

fn invoke_vidsrc_icu(
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) => format!("https://vidsrc.icu/embed/tv/{}/{}/{}", tmdb_id, s, e),
        _ => format!("https://vidsrc.icu/embed/movie/{}", tmdb_id),
    };
    Some(make_embed("VidSrc.icu", &url))
}

fn invoke_vidlink(
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) => format!("https://vidlink.pro/tv/{}/{}/{}", tmdb_id, s, e),
        _ => format!("https://vidlink.pro/movie/{}", tmdb_id),
    };
    Some(make_embed("VidLink", &url))
}

fn invoke_2embed(imdb_id: &str, season: Option<i64>, episode: Option<i64>) -> Option<YawnStream> {
    let url = match (season, episode) {
        (Some(s), Some(e)) => format!("https://www.2embed.cc/embedtv/{}&s={}&e={}", imdb_id, s, e),
        _ => format!("https://www.2embed.cc/embed/{}", imdb_id),
    };
    Some(make_embed("2Embed", &url))
}

fn invoke_embedsu(imdb_id: &str, season: Option<i64>, episode: Option<i64>) -> Option<YawnStream> {
    let url = match (season, episode) {
        (Some(s), Some(e)) => format!("https://embed.su/embed/tv/{}/{}/{}", imdb_id, s, e),
        _ => format!("https://embed.su/embed/movie/{}", imdb_id),
    };
    Some(make_embed("Embed.su", &url))
}

fn invoke_multiembed(
    imdb_id: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (season, episode) {
        (Some(s), Some(e)) =>
            format!("https://multiembed.mov/?video_id={}&tmdb=1&s={}&e={}", imdb_id, s, e),
        _ => format!("https://multiembed.mov/?video_id={}&tmdb=1", imdb_id),
    };
    Some(make_embed("MultiEmbed", &url))
}

fn invoke_smashystream(
    imdb_id: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (season, episode) {
        (Some(s), Some(e)) => format!("https://player.smashy.stream/tv/{}/{}/{}", imdb_id, s, e),
        _ => format!("https://player.smashy.stream/movie/{}", imdb_id),
    };
    Some(make_embed("SmashyStream", &url))
}

fn invoke_autoembed(
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) => format!("https://autoembed.co/tv/tmdb/{}-{}-{}", tmdb_id, s, e),
        _ => format!("https://autoembed.co/movie/tmdb/{}", tmdb_id),
    };
    Some(make_embed("AutoEmbed", &url))
}

fn invoke_111movies(
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) => format!("https://111movies.com/tv/{}/{}/{}", tmdb_id, s, e),
        _ => format!("https://111movies.com/movie/{}", tmdb_id),
    };
    Some(make_embed("111Movies", &url))
}

fn invoke_moviesapi(
    imdb_id: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (season, episode) {
        (Some(s), Some(e)) => format!("https://moviesapi.club/tv/{}-{}-{}", imdb_id, s, e),
        _ => format!("https://moviesapi.club/movie/{}", imdb_id),
    };
    Some(make_embed("MoviesAPI", &url))
}

fn invoke_rive(
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) =>
            format!(
                "https://rivestream.live/embed?type=tv&id={}&season={}&episode={}",
                tmdb_id,
                s,
                e
            ),
        _ => format!("https://rivestream.live/embed?type=movie&id={}", tmdb_id),
    };
    Some(make_embed("RiveStream", &url))
}

fn invoke_nontongo(
    imdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) =>
            format!("https://www.nontongo.win/embed/tv/{}/{}/{}", imdb_id, s, e),
        _ => format!("https://www.nontongo.win/embed/movie/{}", imdb_id),
    };
    Some(make_embed("Nontongo", &url))
}

fn invoke_primewire(
    imdb_id: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (season, episode) {
        (Some(s), Some(e)) =>
            format!(
                "https://www.primewire.tf/embed/tv?imdb={}&season={}&episode={}",
                imdb_id,
                s,
                e
            ),
        _ => format!("https://www.primewire.tf/embed/movie?imdb={}", imdb_id),
    };
    Some(make_embed("PrimeWire", &url))
}

fn invoke_pressplay(
    tmdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) =>
            format!("https://pressplay.top/embed/tv/{}/{}/{}", tmdb_id, s, e),
        _ => format!("https://pressplay.top/embed/movie/{}", tmdb_id),
    };
    Some(make_embed("PressPlay", &url))
}

fn invoke_superembed(
    imdb_id: &str,
    media_type: &str,
    season: Option<i64>,
    episode: Option<i64>
) -> Option<YawnStream> {
    let url = match (media_type, season, episode) {
        ("tv", Some(s), Some(e)) =>
            format!(
                "https://superembed.stream/embed/tv?imdb={}&season={}&episode={}",
                imdb_id,
                s,
                e
            ),
        _ => format!("https://superembed.stream/embed/movie?imdb={}", imdb_id),
    };
    Some(make_embed("SuperEmbed", &url))
}

// ─── Subtitles ────────────────────────────────────────────────────────────────

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
        .filter_map(|s|
            Some(YawnSubtitle {
                url: s.url?,
                language: s.lang.unwrap_or_else(|| "Unknown".to_string()),
            })
        )
        .take(30)
        .collect();

    Ok(subs)
}
