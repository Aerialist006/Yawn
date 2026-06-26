# Yawn

Yawn is a lightweight Tauri desktop app that will consume Stremio add-ons through a Rust backend and render a clean, fast frontend with React + TypeScript.

## Roadmap

### Phase 0

Repository initialization, file structure, Tauri setup, dependencies, and baseline files.

### Phase 1

Rust backend for Stremio add-on support:

- Add-on manifest ingestion
- Catalog support
- Meta support
- Stream support
- Torrent/magnet handling strategy

### Phase 2

Frontend implementation:

- Add-on management
- Catalog browsing
- Meta/detail pages
- Stream selection and playback UX

### Phase 3

Optimization:

- Dependency pruning
- Memory usage improvements
- Leak prevention
- Runtime performance cleanup

## Stack

- Tauri v2
- Rust
- React
- TypeScript
- Vite

## Development

```bash
npm install
npm run tauri dev
```
