use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YawnMediaItem {
    pub id: String,          // TMDB id
    pub imdb_id: Option<String>,
    pub title: String,
    pub media_type: String,  // "movie" | "tv"
    pub poster: Option<String>,
    pub backdrop: Option<String>,
    pub overview: Option<String>,
    pub year: Option<String>,
    pub rating: Option<f64>,
    pub genres: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YawnEpisode {
    pub id: String,
    pub title: Option<String>,
    pub overview: Option<String>,
    pub season: i64,
    pub episode: i64,
    pub air_date: Option<String>,
    pub still: Option<String>,
    pub runtime: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YawnStream {
    pub url: String,
    pub name: String,
    pub quality: Option<String>,
    pub stream_type: String, // "hls" | "mp4" | "dash"
    pub headers: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YawnSubtitle {
    pub url: String,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YawnMeta {
    pub item: YawnMediaItem,
    pub seasons: Option<Vec<YawnSeason>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct YawnSeason {
    pub number: i64,
    pub name: Option<String>,
    pub episodes: Vec<YawnEpisode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StreamResult {
    pub streams: Vec<YawnStream>,
    pub subtitles: Vec<YawnSubtitle>,
}