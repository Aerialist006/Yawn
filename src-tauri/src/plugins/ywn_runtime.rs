use boa_engine::{ Context, Source, JsValue, JsString, NativeFunction, js_string };
use std::path::Path;

pub fn run_plugin_hook(
    plugin_dir: &Path,
    entry: &str,
    hook_name: &str,
    args_json: &str
) -> Result<String, String> {
    let js_path = plugin_dir.join(entry);
    let js_code = std::fs
        ::read_to_string(&js_path)
        .map_err(|e| format!("Failed to read plugin JS: {e}"))?;

    let mut ctx = Context::default();

    let fetch_fn = NativeFunction::from_fn_ptr(|_this, args, _ctx| {
        let url = args
            .get(0)
            .and_then(|v| v.as_string())
            .map(|s| s.to_std_string_escaped())
            .unwrap_or_default();

        let body = reqwest::blocking
            ::get(&url)
            .and_then(|r| r.text())
            .unwrap_or_else(|_| "{}".to_string());

        // ← Boa 0.19: String → &str → JsString → JsValue
        let js_str = JsString::from(body.as_str());
        Ok(JsValue::from(js_str))
    });

    ctx
        .register_global_callable(js_string!("fetchSync"), 1, fetch_fn)
        .map_err(|e| format!("Failed to register fetchSync: {e:?}"))?;

    let args_injection = format!("const __args = {};", args_json);
    ctx
        .eval(Source::from_bytes(args_injection.as_bytes()))
        .map_err(|e| format!("Failed to inject args: {e}"))?;

    let wrapped =
        format!(r#"
        let __pluginExport = null;
        const module = {{ exports: {{}} }};
        const exports = module.exports;
        {}
        if (typeof module.exports.default !== 'undefined') {{
            __pluginExport = module.exports.default;
        }} else {{
            __pluginExport = module.exports;
        }}
        "#, js_code);

    ctx
        .eval(Source::from_bytes(wrapped.as_bytes()))
        .map_err(|e| format!("Plugin eval failed: {e}"))?;

    let call_hook = format!(
        r#"
        (function() {{
            if (typeof __pluginExport.{hook} !== 'function') return JSON.stringify([]);
            const result = __pluginExport.{hook}(__args);
            if (result && typeof result.then === 'function') {{
                return JSON.stringify([]);
            }}
            return JSON.stringify(result ?? []);
        }})()
        "#,
        hook = hook_name
    );

    let result = ctx
        .eval(Source::from_bytes(call_hook.as_bytes()))
        .map_err(|e| format!("Hook call failed: {e}"))?;

    let json = result
        .as_string()
        .map(|s| s.to_std_string_escaped())
        .unwrap_or_else(|| "[]".to_string());

    Ok(json)
}
