use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddonDefinition {
    pub transport_url: String,
    pub manifest_url: String,
    pub enabled: bool,
    pub manifest: Option<StremioManifest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StremioManifest {
    pub id: String,
    pub version: String,
    pub name: String,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub background: Option<String>,
    #[serde(default)]
    pub types: Vec<String>,
    #[serde(default)]
    pub resources: Vec<Value>,
    #[serde(default)]
    pub catalogs: Vec<StremioCatalog>,
    #[serde(default)]
    pub behaviorHints: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StremioCatalog {
    pub r#type: String,
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub extra: Vec<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StremioMetaPreview {
    pub id: String,
    pub r#type: String,
    pub name: String,
    pub poster: Option<String>,
    pub posterShape: Option<String>,
    pub description: Option<String>,
    pub releaseInfo: Option<String>,
    pub imdbRating: Option<String>,
    #[serde(default)]
    pub genres: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StremioMetaItem {
    pub id: String,
    pub r#type: String,
    pub name: String,
    pub poster: Option<String>,
    pub background: Option<String>,
    pub logo: Option<String>,
    pub description: Option<String>,
    #[serde(default)]
    pub genres: Vec<String>,
    #[serde(default)]
    pub videos: Vec<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StremioStream {
    pub name: Option<String>,
    pub title: Option<String>,
    pub url: Option<String>,
    pub externalUrl: Option<String>,
    pub ytId: Option<String>,
    pub infoHash: Option<String>,
    pub fileIdx: Option<i64>,
    #[serde(default)]
    pub sources: Vec<String>,
    pub behaviorHints: Option<Value>,
}