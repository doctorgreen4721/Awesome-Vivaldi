# AGENTS.md — Awesome-Vivaldi Repository Guide

Agent context for working in this repository. `CLAUDE.md` is a pointer to this file.

## Project Overview

Awesome Vivaldi is a curated community mod pack for the Vivaldi Browser. It contains CSS and JavaScript modifications that alter Vivaldi's browser chrome UI and add AI-powered features. There is **no build system, no test suite, and no package manager** — this is a collection of static files that are injected directly into Vivaldi's runtime.

## Version Targets

- **`Vivaldi8.0Stable/`** — Active development (Vivaldi ≥ 7.9). All new work goes here.

Each version directory mirrors the same structure: `CSS/` and `Javascripts/`.

## Installation

```bash
# Windows (PowerShell as Administrator)
.\install.ps1

# macOS / Linux
./install.sh
```

Both scripts auto-discover Vivaldi's installation directory, create `user_mods/css/` and `user_mods/js/`, copy all mod files, and inject `injectMods.js` into `window.html`. Re-run after pulling updates — the installer overwrites mod files but preserves user config. Installs from older versions (`.vivaldimods/<version>/`) are detected and migrated automatically.

See `Doc/dev/installer-design.md` for architecture details.

### Dev-Install (headless, for mod development)

`dev-install.sh` deploys a single mod to a hardcoded Vivaldi install path **without** the TUI installer. **Local-only script — not tracked in git; edit `VIVALDI_WIN` inside it to match your install.**

```bash
./dev-install.sh --setup      # first run: inject loader + Import.css
./dev-install.sh AskOnPage    # deploy a mod (JS + optional CSS pair)
./dev-install.sh --status     # check what's deployed
./dev-install.sh --restart    # kill + restart Vivaldi
```

## Adding a New Mod

1. JS: create `Vivaldi8.0Stable/Javascripts/<Mod>.js` (plus optional `Vivaldi8.0Stable/CSS/<Mod>.css`).
2. CSS: add `@import "<Mod>.css";` to `Vivaldi8.0Stable/Import.css` (CSS mods load only via this chain; filenames cannot contain spaces).
3. Deploy: run the installer TUI (`install.ps1` / `install.sh`) or `./dev-install.sh <Mod>` (local only).
4. **No `window.html` edits needed** — installer mode discovers `user_mods/js/` dynamically at runtime.
5. AI/Markdown mods: depend on `VividAI.js` + `VividMarkdown.js` (see Shared Core Modules); do not reimplement.
6. Copy the `==UserScript==` / `==UserStyle==` metadata header from an existing mod file (name, description, version `YYYY.M.D`, author, website).

## Architecture: How Mods Load

### CSS Mods → `Import.css`

`Import.css` is the single entry point. CSS files are loaded via `@import`:

```css
@import "SomeMod.css";
```

- Place new `.css` files in `CSS/` and add an `@import` in `Import.css`.
- Commented-out imports disable a mod. Abandoned mods are kept as comments.
- Vivaldi serves CSS mods via `chrome://vivaldi-data/css-mods/css` — CSS files **cannot have spaces** in their filenames.

### JavaScript Mods → `injectMods.js`

**Installer mode (recommended):** `injectMods.js` is injected into Vivaldi's original `window.html` by `install.sh` / `install.ps1`. It dynamically discovers JS mods from `user_mods/js/` via `chrome.runtime.getPackageDirectoryEntry`, loads `ModConfig.js` + `VividAI.js` + `VividMarkdown.js` first, then the rest alphabetically with `async=false` to preserve order. CSS is loaded by injecting `<link rel="stylesheet">` to `user_mods/css/Import.css`.

**Manual mode (legacy):** Users copy `Vivaldi8.0Stable/Javascripts/` contents into Vivaldi's `resources/vivaldi/` directory and replace the browser's original `window.html` with the repo's copy, which lists all `<script>` tags statically. In this mode script order is literal — `VividToast.js`, `VividAI.js`, `VividMarkdown.js` must precede any mod that consumes them.

### Inter-Mod Communication → `CustomEvent`

Mods communicate via `CustomEvent` dispatched on `document`, **not** via `window.__global` flags (deprecated; removed in the `6347eb7` refactor). Each mod listens for events from other mods and dispatches its own:

```javascript
// Dispatch
document.dispatchEvent(new CustomEvent("vividpeek:tabSelected", { detail: { tabId } }));
// Listen
document.addEventListener("vividpeek:tabSelected", (e) => { const { tabId } = e.detail; });
```

### Shared Configuration → `ModConfig.js`

`ModConfig.js` is the central settings system. It:

- Injects an "Awesome Vivaldi" section into `vivaldi:settings/appearance/`
- Stores config in OPFS (Origin Private File System) under `.askonpage/config.json`
- Provides import/export for settings portability

### Shared Core Modules

Two core modules provide reusable AI and Markdown functionality. All AI/Markdown mods **MUST** depend on these instead of implementing their own:

**`VividAI.js`** — Shared AI configuration loader and OpenAI-compatible API caller.
- `VividAI.config` — mutable runtime config (apiKey, apiEndpoint, model, etc.)
- `VividAI.loadConfig({ modKey })` — load from OPFS `config.json`, merge with per-mod overrides
- `VividAI.applyConfig(raw)` — external config push (via `vivaldi-mod-ai-config-updated` event)
- `VividAI.streamChat({ messages, signal, onDelta, ... })` — SSE streaming → `{ text, response }`
- `VividAI.fetchJSON({ messages, ... })` — non-streaming JSON request

**`VividMarkdown.js`** — Shared Markdown-to-HTML renderer with LaTeX, code highlighting, table support.
- `VividMarkdown.render(md, hooks?)` — Markdown → HTML. `hooks.blockquote(lines)` for citation injection
- `VividMarkdown.enhanceCodeBlocks(el)` — add copy buttons + syntax highlight to code blocks
- `VividMarkdown.splitStable(md)` — streaming: split into committed + preview
- `VividMarkdown.cleanModelText(text)` — strip `<thinking>` tags

**When developing a mod that needs AI or Markdown:**
1. Call `VividAI.loadConfig({ modKey: "yourModKey" })` in your init
2. Use `VividAI.streamChat()` / `VividAI.fetchJSON()` for all API calls
3. All mods except Diabar **MUST** pass `extra: { thinking: { type: "disabled" } }` to disable model thinking
4. Use `VividMarkdown.render()` for all Markdown rendering; pass `hooks.blockquote` for custom blockquote handling (e.g. citation detection)
5. Do **NOT** implement your own AI config loading, SSE parsing, or Markdown parser

## Key Development Constraints

### CSS Gotchas
- **CSS variables break between Vivaldi versions.** Hardcoded `px` values are safer than `var()` fallbacks. Verify with Computed Styles in DevTools.
- **`!important` is often necessary.** Vivaldi sets many inline styles via JS; `position: fixed !important` or similar overrides are normal.
- **`:has()` is the primary tool for backward DOM selection.** Useful when a later element needs to style an earlier one (common in Vivaldi's DOM order).
- **CSS Anchor Positioning is unreliable.** Use `left: 50%; transform: translateX(-50%)` instead of `anchor-center`.

### JavaScript Gotchas
- **window.html scripts run in MV3-like context.** `chrome.scripting.executeScript` works; `chrome.tabs.executeScript` does not.
- **MutationObserver must attach to `#browser`** (persistent). Workspace switching rebuilds `.tab-strip`, so re-bind inner observers when the strip is rebuilt.
- **Check `tab.url` before injection.** `chrome.tabs.executeScript` throws on `chrome://` / `vivaldi://` pages.

### No Spaces in CSS Filenames
Vivaldi's CSS mod loader rejects filenames with spaces. Use `CamelCase.css` or `kebab-case.css`.

### Reaching Vivaldi React Internals via Fiber

Some Vivaldi features (e.g. StackEditor, inline rename) can only be triggered through React component methods not exposed in the public API. Walk the React fiber tree from a stable DOM element:

```javascript
const el = document.querySelector(".tab-strip");
const fiberKey = Object.keys(el).find(k => k.startsWith("__reactFiber$"));
if (!fiberKey) return;
let fiber = el[fiberKey];
let depth = 0;
while (fiber && depth < 50) {
  if (fiber.stateNode && typeof fiber.stateNode.someMethod === "function") {
    fiber.stateNode.someMethod(args);
    break;
  }
  fiber = fiber.return;
  depth++;
}
```

**Known reachable methods (found via `Others/Source/bundle.js` analysis):**

| Method | Component location | Effect |
|---|---|---|
| `setAwaitingEdit(groupId, true)` | Above `.tab-strip` | Opens native StackEditor modal (name + color picker) |

**How to discover more:** Search `Others/Source/bundle.js` for the command name (e.g. `COMMAND_RENAME_TAB_STACK`), trace its handler to the React method, then verify the component is reachable via fiber from a stable DOM element like `.tab-strip`.

## Debugging

- **Inspect Vivaldi UI:** Open `vivaldi:inspect/#apps`, click the blue **inspect** button on `window.html`. This opens DevTools for the browser chrome.
- **Verify JS mods installed:** In the DevTools Elements tab, look for the injected `<script>` tags.
- **CSS mod debugging:** Check the Styles panel in DevTools to see if your rules are applied or overridden.
- **Live console capture:** the `vivaldi-browser` skill's `cdp-client.mjs --console` auto-launches Vivaldi with a debug port.

## Reference Resources

- **`Others/Reverse/`** — **Primary reference for Vivaldi internals.** Reverse-engineered from a Vivaldi 8.1 install: webpack bundle deconstruction (906 modules with catalog), `self.vivaldi.*` API surface, C++ extension functions, preference system (paths + defaults), and module dependency graph. See `Others/Reverse/README.md` for the full index.
- **`Others/Source/bundle.js`** and **`common.css`** — Vivaldi's core webpack bundles (6.5 MB + 1 MB) revealing internal APIs and CSS.
- **`Doc/BundleReverse/`** — Older reverse-engineered docs for specific subsystems (`vivaldi.prefs`, `vivaldi.tabs`, `vivaldi.window`, etc.).
- **`Doc/design/`** — Design philosophy: `DESIGN.md` (color strategy, `light-dark()`, `color-mix()`, tonal layering, motion), `PRODUCT.md` (user personas, brand personality, anti-references).
- **`Doc/dev/`** — Development architecture (`installer-design.md`) and the `vivaldi-css-variables.md` theme-variable reference.
- **`Doc/mod/`** — Per-mod documentation (English + Chinese `modzh/` translations).
- **Lonm's Vivaldi Modders API:** https://lonmcgregor.github.io/VivaldiModdersAPI/OfficialApi/everything.html
- **DeepWiki (Vivaldi Source):** https://deepwiki.com/ric2b/Vivaldi-browser

## Community Attribution

Many mods integrate or adapt code from the Vivaldi Forum community. The README lists attributions. When adding a new mod based on community code, include the forum thread URL in the file header.

## Vivaldi CSS Variables (summary)

Vivaldi exposes theme-aware CSS custom properties on `#browser` (or `:root`). They follow the user's active theme and are safe to use in CSS mods via `var()`. **Record variable names only — values change with theme.** Full reference: `Doc/dev/vivaldi-css-variables.md`.

Main series: `--colorBg*` (backgrounds), `--colorFg*` (text), `--colorHighlightBg*` (primary accent), `--colorAccentBg*` (secondary accent), `--colorBorder*`, `--colorSuccess/Warning/Error*` (semantic states), `--radius*`, plus `--colorTabBar`, `--densityGap`, `--scrollbarWidth`, `--monospaceFont`, `--sansSerifFont`, `--uiZoomLevel`. These are Vivaldi's own theme system — do not redefine them, only reference them.
