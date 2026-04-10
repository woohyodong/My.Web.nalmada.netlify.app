# Project Guidelines

## Code Style

**Module Patterns**: All modules use IIFE encapsulation—wrap code in `(() => { /* module code */ })()` with selective global exposure via `window.ModuleName`. Mix jQuery (`$`) for convenience and vanilla `document.querySelector` as needed.

**Storage Pattern**: Always wrap localStorage with `safeJSON` helper:
```js
const safeJSON = {
  read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; }
    catch (_) { return fallback; }
  },
  write(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};
```

**Key Naming**: Use `"module:feature:version"` format (e.g., `"memorize:options:v1"`) to enable safe migrations between schema changes.

## Architecture

**PWA Structure**: Standalone modules communicate only through localStorage. Service worker ([sw.js](sw.js)) uses network-first strategy for code/data, cache-first for assets.

**Shared APIs**: Global utilities in [js/site.js](js/site.js):
- `SiteTheme` - dark/light mode toggle
- `SiteOverlay` - modal stack with browser back-button integration  
- `SiteWakeLock` - screen sleep prevention
- `SiteFX` - confetti effects

**Browser APIs**: Feature-detect optional APIs (Web Speech, Wake Lock, Web Share) and provide graceful fallbacks. See [PROJECT_SPEC.md](PROJECT_SPEC.md#32-브라우저-기능-활용) for complete API usage.

## Build and Development

**No build step**—edit files directly. Static hosting expects absolute paths (`/memorize/`, `/bible-read/`, `/prayer/`).

**Local Development**: Use `http://localhost:PORT` (service worker disabled on localhost). Access via DevTools → Application → Local Storage to inspect state.

**Deployment**: Designed for Netlify static hosting. See [README.md](README.md) for deployment details.

## Conventions

**Error Handling**: Silent failures expected for localStorage parsing and optional browser APIs. Use defensive `try/catch` or feature detection, never throw on missing capabilities.

**Data Loading**: External JSON loaded with `cache: "no-cache"` for freshness. Bible data references use short book names ([data/bible_db.json](data/bible_db.json)) for GOODTV audio API integration.

**State Management**: 
- Store settings/progress with versioned keys for migration safety
- Include fallback defaults in every `safeJSON.read()` call
- Use `order` field for user-sortable lists, resequence on load

**Text Processing**: Korean-specific formatting for TTS, dates, and numerals. See `formatNumberForTTS()` and related helpers in modules for patterns.

For detailed implementation patterns and data schemas, see [PROJECT_SPEC.md](PROJECT_SPEC.md).