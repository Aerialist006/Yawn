use serde::{ Deserialize, Serialize };
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddonDefinition {
    pub transport_url: String,
    pub manifest_url: String,
    pub enabled: bool,
    pub manifest: Option<StremioManifest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StremioManifest {
    pub id: String,
    pub version: String,
    pub name: String,
    pub description: Option<String>,
    pub logo: Option<String>,
    pub background: Option<String>,
    pub types: Vec<String>,
    pub resources: Vec<Value>,
    pub catalogs: Option<Vec<ManifestCatalog>>,
    pub behavior_hints: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestCatalog {
    #[serde(rename = "type")]
    pub catalog_type: String,
    pub id: String,
    pub name: String,
    pub extra: Option<Vec<Value>>,
}
