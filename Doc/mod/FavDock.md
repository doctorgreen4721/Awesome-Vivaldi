English | [简体中文](modzh/FavDock.md)

---

# FavDock Design and Implementation Analysis

## 1. Dependencies

### Vivaldi Internal APIs

- **`chrome.tabs.query`**: Derive favorites (first 9 pinned tabs carrying the marker)
- **`chrome.tabs.get`**: Get individual tab info (verify tab still exists)
- **`chrome.tabs.update`**: Pin/unpin tabs, write `vivExtData.fixedTitle` (the marker)
- **`chrome.tabs.move`**: Place favorites into their 9 slots, reorder, unpin moves
- **`chrome.tabs.remove`**: Close tabs (middle-click)
- **`chrome.tabs.onActivated`**: Track active tab changes
- **`chrome.tabs.onUpdated`**: Track title/favicon/URL/pin changes
- **`chrome.tabs.onRemoved` / `onCreated`**: Re-sync favorites
- **`chrome.windows.getLastFocused` / `onFocusChanged`**: Current window tracking

### Browser APIs

- **`vivExtData.fixedTitle`**: Vivaldi's native "fixed title" field — the favorite
  marker `✦` is prefixed here. Persists across restarts; survives mod removal.
- **MutationObserver**: Keep dock mounted; keep hidden-pin classes applied
- **HTML5 Drag & Drop API**: capture-phase `drop` router intercepts tab drops
  before Vivaldi's own handlers

### Inter-Mod Dependencies

- No direct inter-mod dependencies
- CSS file: `FavDock.css` provides all styles
- Replaces: `FavouriteTabs.css` (the old CSS-only grid hack)

## 2. Concepts

### What is a favorite?

A favorite is a **pinned tab whose fixed title carries the `✦` marker and sits
in the first 9 pinned slots**. This is the browser's own data — no OPFS, no
JSON store. Two conditions both hold:

1. Fixed title contains `✦` (via `vivExtData.fixedTitle`)
2. The tab is one of the first 9 pinned tabs

The marker is written with `chrome.tabs.update(tabId, { vivExtData })` (the
same mechanism TidyTabs uses). The tab strip displays the fixed title, so the
marker is visible there; `syncFavorites` maintains the invariant — a marked
tab that is no longer first-9-pinned (dragged out, unpinned, or over capacity)
gets its marker stripped automatically.

### Why this design

- **Uninstall-safe**: remove the mod and favorites are just ordinary pinned
  tabs with a `✦` in the title — nothing is lost
- **No external storage**: the tab list IS the storage
- **No false positives**: user's own pinned tabs (no marker) are untouched
- **Cross-restart stable**: fixed titles persist natively

## 3. Features

### Core Functionality

FavDock is a favorites dock injected at the top of the vertical tab bar,
inspired by Arc Favorites and Zen Essentials. Favorite tabs are hidden in the
tab strip and shown as a 9-slot icon grid (2 columns × 5 rows), each slot
bordered with the browser theme's accent color.

### Key Features

1. **9-slot grid** — `CONFIG.maxFavorites = 9`; empty slots stay invisible
   until a drag hovers the dock
2. **Drop zone** — only while dragging, and only when favorites is empty
3. **Zen-style drop indicators** — hovering an empty slot shows a dashed
   drop frame (pop animation); hovering a filled slot shows an insertion
   ring and the existing favorites *yield* with a slide animation (same
   shift math as Zen's `getTabShift`)
4. **Cross-type dragging** — a capture-phase `drop` router intercepts drops
   on the tab strip, so any of the three tab types can be dragged into any
   zone:
   - normal tab → pinned zone: pins + moves there; → favorites zone: also
     gets the marker
   - favorite/pinned tab → normal zone: unpins (marker stripped)
   - favorite → favorites zone: reorders
   - plain reorders (normal↔normal, pinned↔pinned outside slot 0-8) are
     passed through to Vivaldi untouched
5. **Strip drop indicator** — a thin accent line shows the landing position
   while dragging over the tab strip
6. **Click to activate** / **middle-click to close** / **drag to reorder**
   within the dock / **context menu** (Remove / Unpin & Remove)
7. **Active indicator** — accent bar under the active favorite
8. **Theme accent borders** — `--favdock-accent` = `var(--colorAccentBg)`

### Behavioral Expectations

- Only mounts in vertical tab mode (left/right tab bar)
- Favorites always occupy the leading pinned slots (batch `tabs.move` to
  index 0 keeps them first, user pins after)
- Max 9 favorites; a 10th marked pin gets its marker stripped on sync

## 4. Drag & Drop Design

### Detection (three tracks)

Vivaldi's tab drag mixes native C++ (mouse events) with react-dnd (HTML5
drag events), so detection covers all three:

1. `mousedown` on `.tab` + 5px threshold (mouse path)
2. HTML5 `dragstart` on document
3. MutationObserver watching `.tab-position.dragging` / `.tab-dropzone`

### Drop router

A **capture-phase** `drop` listener on `document` runs before Vivaldi's
handlers (react-dnd registers on the root element, target phase). It decides:

| Drop location | Source | Action |
|---|---|---|
| Dock slot i (empty) | any | pin + marker + move to slot i |
| Dock slot i (filled) | favorite | reorder (move to slot i) |
| Dock slot i (filled) | other | pin + marker + move to slot i, old occupants yield |
| Tab strip, index < 9 | any | becomes favorite (pin + marker + move) |
| Tab strip, pinned zone (9+) | any | plain pinned (marker stripped) |
| Tab strip, normal zone | pinned/favorite | unpin + marker stripped |
| Tab strip, normal zone | normal | **passed through** to Vivaldi |
| Elsewhere | any | passed through (new window, etc.) |

The real insertion index is computed from the client Y against the tab strip,
counting hidden favorite pins (they stay in the DOM, `display: none`).

### Zen-style yield animation

During `dragover` on the dock, filled slots from the hover index onward get a
`translateY`/`translate` transform (one slot size), crossing grid rows with
the same `[±x, ±y]` compensation Zen uses. Transitions are 180ms
`cubic-bezier(0.4, 0, 0.2, 1)`.

## 5. Key Implementation Details

**Marker write** (idempotent, preserves user's own fixed title):
```
viv = JSON.parse(tab.vivExtData || "{}")
viv.fixedTitle = "✦ " + (viv.fixedTitle || tab.title).replace(/✦/g, "").trim()
chrome.tabs.update(tabId, { vivExtData: JSON.stringify(viv) })
```

**Invariant enforcement** in `syncFavoritesNow`:
1. Marked tabs not in the first 9 pinned slots → marker stripped
2. Marked tabs batch-moved to the front of the pinned block (single
   `chrome.tabs.move(ids, { index: 0 })`) so favorites are always contiguous
3. Favorites list = first 9 pinned ∩ marked

**Hidden pins**: `.tab-strip > .tab-position.is-pinned.favdock-hidden {
display: none !important }`, applied by a strip MutationObserver based on the
marker in the tab title text.

**z-index**: the dock uses `z-index: 1` — above the tab strip, below the
toolbar/mainbar (10+), so auto-hiding the main bar never leaves favorites
covering the address bar.

## 6. Usage

### Enabling

1. Place `FavDock.js` in the `Javascripts/` directory under the Vivaldi resources directory
2. Place `FavDock.css` in the `CSS/` directory and import it in `Import.css`
3. Add `<script src="Javascripts/FavDock.js"></script>` in `window.html`
4. Enable "Allow CSS Modification" in `vivaldi://experiments`

### User Interaction

- **Add to favorites**: drag a tab onto the dock (empty slot or drop zone);
  the tab is pinned and gets the `✦` marker
- **Activate**: click a favorite icon
- **Close tab**: middle-click a favorite icon
- **Reorder**: drag a favorite icon to another slot
- **Remove**: right-click a favorite → "Remove from Favorites" (keeps pin)
  or "Unpin & Remove"

### Configuration

The `CONFIG` object at the top of `FavDock.js`:

| Key | Default | Description |
|---|---|---|
| `maxFavorites` | `9` | Number of favorite slots |
| `marker` | `✦` | Fixed-title marker that identifies favorites |

CSS custom properties in `FavDock.css`:

| Variable | Default | Description |
|---|---|---|
| `--favdock-cell` | `44px` | Slot size |
| `--favdock-gap` | `4px` | Grid gap |
| `--favdock-accent` | `var(--colorAccentBg)` | Border/accent color (theme) |
| `--favdock-animation` | `180ms` | Transition duration |
