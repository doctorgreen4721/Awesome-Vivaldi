# Vivaldi Auto-Hide Tab Bar: Complete Internal Analysis

**Vivaldi 8.0.4033.57 — `bundle.js` + `common.css` deep-dive**

---

## 1. Architecture Overview

The auto-hide mechanism is a **hybrid C++/JS system**:

```
┌─────────────────────────────────────────────────────────────────┐
│  C++ (Chromium Embedded)                                        │
│  ┌───────────────┐    ┌──────────────────┐                      │
│  │ setHotSpot()  │───▶│ onMouseInHotSpot │──(event)──▶ JS       │
│  │ (rect region) │    │ "above" / "away" │                      │
│  └───────────────┘    └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  JS (React + Flux Store)                                        │
│  ┌──────────────────────┐   ┌───────────────────────────┐      │
│  │ NB (AutoHideWrapper) │──▶│ AUTO_HIDE_VISIBILITY      │      │
│  │ onMouseInHotSpot     │   │ reducer → .autoHide Map   │      │
│  │ listener             │   └───────────────────────────┘      │
│  └──────────────────────┘            │                          │
│           ▲                          ▼                          │
│           │              ┌───────────────────────┐              │
│           └──────────────│ Store → setState(show) │              │
│                          │ → CSS .show class      │              │
│                          └───────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CSS                                                            │
│  transform: translateX(calc(-100% - 18px))  ← hidden           │
│  transform: translateX(0)                   ← .show            │
│  transition: transform (JS-controlled duration)                 │
│  ::before pseudo-element (hover zone)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. CSS Mechanism (common.css lines 13840–13956)

### Base state (hidden):

```css
.auto-hide-wrapper {
  position: fixed;
  display: flex;
  z-index: 5;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.2, 0.9, 0.6, 1);
}

/* Off-screen positions: */
.auto-hide-wrapper.left  { left: 6px; transform: translateX(calc(-100% - 18px)); }
.auto-hide-wrapper.right { right: 6px; transform: translateX(calc(100% + 12px)); }
.auto-hide-wrapper.top   { top: 6px;  transform: translateY(calc(-100% - 18px)); }
.auto-hide-wrapper.bottom{ bottom: 6px; transform: translateY(calc(100% + 12px)); }
```

### Shown state:

```css
.auto-hide-wrapper.left.show   { transform: translateX(0); }
.auto-hide-wrapper.right.show  { transform: translateX(0); }
.auto-hide-wrapper.top.show    { transform: translateY(0); }
.auto-hide-wrapper.bottom.show { transform: translateY(0); }
```

### `::before` hover zone (only exists when `.show` is applied):

```css
.auto-hide-wrapper.show:before {
  content: '';
  position: absolute;
  background-color: transparent;
  z-index: -1;
}
/* Directional insets: */
.auto-hide-wrapper.left.show:before   { inset: 0 0 0 -6px; }   /* 6px strip on left edge */
.auto-hide-wrapper.right.show:before  { inset: 0 -6px 0 0; }   /* 6px strip on right edge */
.auto-hide-wrapper.top.show:before    { inset: -6px 0 0 0; }   /* 6px strip on top edge */
.auto-hide-wrapper.bottom.show:before { inset: 0 0 -6px 0; }   /* 6px strip on bottom edge */
```

**Key insight:** The `::before` pseudo-element extends 6px *beyond* the wrapper edge, creating a buffer zone that prevents flicker when the cursor transitions from the screen edge to the wrapper. Without it, moving 1px inward could trigger "away" → hide → cursor at edge → "above" → show → oscillation.

### `transition-duration` is JS-controlled:

```css
/* JS inline style applied: */
style="transition-duration: ${isVisible ? animationSpeed : closingAnimationSpeed}ms"
```

Defaults from prefs:
| Pref | Default | Used when |
|------|---------|-----------|
| `auto_hide_animation_speed` | 100ms | Showing (entering) |
| `auto_hide_closing_animation_speed` | 300ms | Hiding (exiting) |
| `auto_hide_close_delay` | 800ms | Timer before hide dispatch |
| `auto_hide_inactive_delay` | 1500ms | (Referenced but secondary) |

---

## 3. JS Show/Hide Mechanism (bundle.js)

### 3.1 The HotSpot System (C++ → JS Bridge)

Vivaldi's C++ layer manages a rectangular "hot spot" at the screen edge:

```js
// Registration (React useEffect):
z.Z.windowPrivate.onMouseInHotSpot.addListener(v);

// The hotSpot rect is set based on the wrapper's DOM dimensions:
z.Z.windowPrivate.setHotSpot(windowId, position, width, height);
```

The C++ layer fires `onMouseInHotSpot(windowId, status)` where `status` is:
- **`"above"`** — cursor is within the hot spot region (near screen edge)
- **`"away"`** — cursor has left the hot spot region

### 3.2 The Handler (`v` callback in NB component)

```js
v = useCallback((i, s) => {
  // i = windowId, s = "above" | "away"
  if (i !== t.vivaldiWindowId || !r) return;  // r = isVisible state

  Ei.Z.updateHotSpotStatus(i, s);  // Store the hot spot status

  if (s === "above") {
    m();  // Clear any pending hide timeout
    Ei.Z.updateAutoHideVisibility(i, e.position, { visible: true, keepOpen: false });
  }
  else if (s === "away" && b()) {  // b() = shouldAllowShow()
    m();  // Clear any pending hide timeout
    n.current = setTimeout(() => {
      Ei.Z.updateAutoHideVisibility(i, e.position, { visible: false });
    }, d);  // d = close delay (default 800ms)
  }
}, [b, t.vivaldiWindowId, r, d, e.position]);
```

### 3.3 `shouldAllowShow()` (the `b()` function) — THE CRITICAL GUARD

This function determines whether the wrapper is allowed to stay visible. Returns `true` = the wrapper MAY hide; `false` = the wrapper MUST stay shown.

```js
b = useCallback(() => {
  // If this wrapper isn't the currently showing one, don't interfere
  if (ee.ZP.getShowingWrapper(o) !== e.position) return false;

  const n = t.document.activeElement;

  const isFocusableActive = kB(n);  // INPUT, TEXTAREA, SELECT, contenteditable, or menu role
  const focusInsideWrapper = a.current?.nodeRef.current?.contains(n) && isFocusableActive;
  const isResizing = a.current?.nodeRef.current?.querySelector(".resizing") !== null;
  const keepOpen = ee.ZP.getWrapperState(o, e.position).keepOpen;
  const popupOpen = IB(t.document);  // Menu open, button-popup, extension-popup, or CustomizePanelPopup
  const hotSpotAbove = "above" === ee.ZP.getHotSpotStatus(o);

  return !(focusInsideWrapper || isResizing || keepOpen || popupOpen || hotSpotAbove);
}, [t.document, e.position, o]);
```

**`IB()` function:**
```js
function IB(e) {
  return TB.getIsMenuOpen() ||
    Boolean(e.querySelector(
      "#browser > .button-popup, " +
      "#browser > .extension-popup, " +
      "#panels-container > .CustomizePanelPopup"
    ));
}
```

**`kB()` function:**
```js
function kB(e) {
  if (!e) return false;
  const t = e?.tagName;
  return 0 === _.Z.get(Z.kKeyboardTabToAll) ||
    "INPUT" === t || "TEXTAREA" === t || "SELECT" === t ||
    e?.hasAttribute("contenteditable") ||
    "menu" === e?.role;
}
```

### 3.4 State → CSS Class Pipeline

```
AUTO_HIDE_VISIBILITY action
  → reducer updates: autoHide.get(position) = { visible: true/false, keepOpen: true/false }
  → Store listener in NB component: `ee.ZP.addListener(t)`
  → `getWrapperState(windowId, position)` reads the new state
  → Compares: `classList.contains("show") !== state.visible`
  → If mismatch: calls `O(state.visible, onChange)`
  → `O` = useCallback that calls `A(visible)` and `l(visible)` (onChange)
  → React re-renders with `show: visible` → className includes/excludes "show"
```

### 3.5 `updateAutoHideVisibility` — The Dispatcher

```js
updateAutoHideVisibility(e, t, n) {
  this.debounceUpdateAutoHideVisibility.cancel();  // Cancel any pending debounced call
  p.Z.dispatch({
    actionType: "AUTO_HIDE_VISIBILITY",
    windowId: e,
    position: t,
    options: n   // { visible, keepOpen, resetOtherWindows }
  });
}

debounceUpdateAutoHideVisibility = debounce((e, t, n) => {
  this.updateAutoHideVisibility(e, t, n);
}, 100);  // 100ms debounce
```

### 3.6 Additional Show/Hide Triggers

Beyond the hotSpot handler, these also call `updateAutoHideVisibility`:

| Trigger | visible | keepOpen |
|---------|---------|----------|
| Search field focus | true | — |
| Extension popup opens | true | — |
| Panel focus (web panel) | true | true |
| Tab drag start | true | true |
| Fullscreen menubar visible | true | — |
| Window resize | — | — (re-checks, hides if away) |
| Toolbar edit mode start | false | — |
| New window command | false | — |
| `borderTriggeredSide` (tab to edge) | true then false | — |

---

## 4. The `borderTriggeredSide` Mechanism

When the user tabs to the edge of the browser, a special "border triggered" show occurs:

```js
// In the main browser component:
onAutoHideChanged = () => {
  // triggeredSide is set via setState with a callback that immediately clears it
  this.setState(
    (e) => { if (e.triggeredSide !== n) return { triggeredSide: n }; },
    () => { this.setState({ triggeredSide: void 0 }); }  // Clear immediately after
  );
};

// In the NB wrapper component:
useEffect(() => {
  if (e.isEnabled && e.borderTriggeredSide && e.borderTriggeredSide === e.position) {
    // Show after 100ms
    setTimeout(() => {
      Ei.Z.updateAutoHideVisibility(o, e.position, { visible: true });
    }, 100);
    // Hide after `p` ms (inactive delay, default 1500ms)
    setTimeout(() => {
      b() && Ei.Z.updateAutoHideVisibility(o, e.position, { visible: false });
    }, p);
  }
}, [e.isEnabled, e.borderTriggeredSide, e.position, o, b, p]);
```

---

## 5. Known & Potential Race Conditions / Stuck Scenarios

### 5.1 🔴 CRITICAL: `keepOpen` Stuck as `true`

**The most likely cause of the "stuck showing" bug.**

The `keepOpen` flag is set by `updateAutoHideVisibility({ visible: true, keepOpen: true })` and is ONLY cleared by a `{ visible: false, keepOpen: false }` call. The AUTO_HIDE_VISIBILITY reducer:

```js
case "AUTO_HIDE_VISIBILITY":
  const { visible, keepOpen, resetOtherWindows } = options;
  autoHide.set(position, {
    visible: visible || keepOpen || false,   // ← visible is true if keepOpen is true
    keepOpen: keepOpen === undefined
      ? existingAutoHide?.get(position)?.keepOpen || false  // ← PRESERVES previous keepOpen if undefined
      : keepOpen
  });
```

**Problem:** If `keepOpen` was set to `true` (e.g., panel focus, tab drag, web panel interaction) and the hide call uses `{ visible: false }` WITHOUT explicitly setting `keepOpen: false`, the reducer **preserves the existing `keepOpen: true`**. Then `shouldAllowShow()` checks `keepOpen` and returns `false` (don't hide), keeping the wrapper permanently visible.

**Scenarios where this happens:**
- **Panel focus → blur:** `setFocus` dispatches `{ visible: true, keepOpen: true }`. If `removeFocus` never fires (e.g., focus moves to a webview that doesn't properly blur), `keepOpen` stays `true`.
- **Tab drag → drop outside window:** Drag start sets `keepOpen: true`. If `dragEnd` event is lost (dropped on another monitor, OS-level drop), `keepOpen` persists.
- **Web panel interaction:** `showContent` + `{ visible: true, keepOpen: true }`. If the panel is closed programmatically without a corresponding hide call, `keepOpen` persists.

### 5.2 🔴 CRITICAL: `IB()` Popup/Menu Leak

```js
function IB(e) {
  return TB.getIsMenuOpen() || Boolean(e.querySelector(
    "#browser > .button-popup, #browser > .extension-popup, #panels-container > .CustomizePanelPopup"
  ));
}
```

If a `.button-popup` or `.extension-popup` DOM element remains in the document after the popup closes (e.g., animation cleanup failure, React reconciliation delay), `IB()` returns `true` forever, and `shouldAllowShow()` blocks hide indefinitely.

### 5.3 🟡 MODERATE: Hot Spot Registration / React Effect Race

```js
useEffect(() => {
  if (r && e.isEnabled) {  // r = current isVisible state
    // Register hot spot listener
    z.Z.windowPrivate.onMouseInHotSpot.addListener(v);
    return () => { z.Z.windowPrivate.onMouseInHotSpot.removeListener(v); };
  }
  // When not visible, clear the hot spot
  g({ windowId: o, position: e.position, width: 0, height: 0 });
}, [r, v, e.position, g, o, e.isEnabled]);
```

**Problem:** The effect dependencies include `r` (isVisible). When `r` changes from `true` to `false`, the cleanup runs (removes listener) and the new effect body sets width/height to 0. But during the transition:
1. `r` is still `true` when the "away" event fires
2. The 800ms timeout starts
3. During that 800ms, `r` transitions to `false` (from a different code path)
4. The effect re-runs, removing the hot spot listener
5. The 800ms timeout fires, dispatching `{ visible: false }` — but the wrapper may already be in an inconsistent state

### 5.4 🟡 MODERATE: `debounceUpdateAutoHideVisibility.cancel()` Cancelling Hide

```js
updateAutoHideVisibility(e, t, n) {
  this.debounceUpdateAutoHideVisibility.cancel();  // ← cancels any pending debounced call
  p.Z.dispatch({ actionType: "AUTO_HIDE_VISIBILITY", windowId: e, position: t, options: n });
}
```

If `updateAutoHideVisibility` is called with `{ visible: true }` during the 100ms debounce window of a `{ visible: false }` debounced call, the hide is cancelled. This is intentional for "above" → "away" → "above" rapid transitions, but the 100ms debounce on hide means:

```js
debounceUpdateAutoHideVisibility = debounce(updateAutoHideVisibility, 100);
```

The debounced version is used by `f` (show on focus) and `M` (hide on blur). If focus/blur events fire within 100ms of each other, the hide is swallowed.

### 5.5 🟡 MODERATE: `borderTriggeredSide` Timers Not Cleaned Up

```js
useEffect(() => {
  if (e.isEnabled && e.borderTriggeredSide && e.borderTriggeredSide === e.position) {
    setTimeout(() => { Ei.Z.updateAutoHideVisibility(o, e.position, { visible: true }); }, 100);
    setTimeout(() => { b() && Ei.Z.updateAutoHideVisibility(o, e.position, { visible: false }); }, p);
  }
}, [e.isEnabled, e.borderTriggeredSide, e.position, o, b, p]);
```

These `setTimeout` calls are **NOT tracked in a ref and NOT cleared** on cleanup. The `useEffect` cleanup function is:
```js
useEffect(() => () => { m(); }, []);  // m() only clears n.current (the "away" timeout)
```

If the component re-renders or unmounts between the 100ms show and the 1500ms hide, the hide timeout fires on an unmounted or stale component. More critically: if `borderTriggeredSide` changes rapidly, the old timeouts are never cancelled, creating duplicate show/hide cycles.

### 5.6 🟢 MINOR: Window Resize Handler Delay

```js
useEffect(() => {
  function n() {
    clearTimeout(i.current);
    i.current = setTimeout(() => {
      r && "away" === ee.ZP.getHotSpotStatus(o) &&
        Ei.Z.updateAutoHideVisibility(o, e.position, { visible: false });
    }, EB);  // EB = f.yA + 200 (unknown constant + 200ms)
  }
  t.addEventListener("resize", n);
  return () => { t.removeEventListener("resize", n); clearTimeout(i.current); };
}, [t, r, e.position, o]);
```

During rapid window resizing, this debounces correctly. But if the wrapper is visible during resize, the hot spot rect may become stale (C++ side), causing `onMouseInHotSpot` to fire with incorrect "above"/"away" status.

### 5.7 🟢 MINOR: `classList.contains("show")` Sync Check

```js
// Store listener that syncs React state with DOM:
function t() {
  const state = ee.ZP.getWrapperState(o, e.position);
  const domShow = a.current?.nodeRef.current?.classList.contains("show");
  const needsUpdate = domShow !== state.visible;
  O(state.visible, needsUpdate ? e.onChange : undefined);
}
```

This is a reconciliation check that runs on every store change. If the DOM `.show` class and the store state get out of sync (e.g., during a React batching delay), `onChange` is called to force a re-render. But if this reconciliation fires during a CSS transition, the class toggle can cause the animation to restart or jump.

---

## 6. The `::before` Hover Zone Interaction

The `::before` pseudo-element creates a 6px invisible extension beyond the wrapper edge. This is critical for the show/hide behavior:

### How it works:
1. When `.show` is applied, `::before` appears as a 6px transparent strip extending outward
2. The hot spot rect (set via `setHotSpot`) uses the wrapper's DOM dimensions (`clientWidth`/`clientHeight`)
3. The `::before` pseudo-element does NOT affect `clientWidth`/`clientHeight` (it's absolutely positioned with `inset`)
4. Therefore, the hot spot rect and the `::before` hover zone are **different regions**

### The gap problem:
- The hot spot is defined by the wrapper's actual box (before transform)
- The `::before` extends 6px beyond that box
- There's a **dead zone** between the screen edge and the wrapper where neither the hot spot nor the wrapper captures mouse events
- The 6px padding (`left: 6px` / `right: 6px` / `top: 6px` / `bottom: 6px`) is meant to bridge this gap

### Why it can cause stuck states:
If the cursor enters the `::before` zone but exits through the top/bottom of the wrapper (not through the edge), the `onMouseInHotSpot` event may not fire "away" because the cursor is still technically within the wrapper's bounding rect. The `::before` zone extends the hoverable area, but the hot spot is defined by the wrapper's actual box.

---

## 7. Summary of Root Causes for "Stuck Showing"

Ranked by likelihood:

| # | Cause | Likelihood | Fix |
|---|-------|------------|-----|
| 1 | **`keepOpen: true` persists** after panel/drag/popup interaction | 🔴 High | Ensure all hide calls explicitly set `keepOpen: false` |
| 2 | **`IB()` returns true** due to leftover popup DOM | 🔴 High | Check for ghost `.button-popup` / `.extension-popup` elements |
| 3 | **`shouldAllowShow()` blocks hide** due to active focus inside wrapper | 🟡 Medium | Tab/keyboard focus trapped in wrapper after mouse leaves |
| 4 | **HotSpot C++ → JS desync** after resize/display change | 🟡 Medium | HotSpot rect stale; C++ doesn't fire "away" |
| 5 | **`borderTriggeredSide` timers** not cleaned up | 🟡 Medium | Uncancellable timeouts cause duplicate show/hide |
| 6 | **Debounced hide swallowed** by rapid show event | 🟢 Low | 100ms debounce window is wide enough for fast mouse movements |

### Debugging Checklist:
1. When stuck, check `document.querySelector('.auto-hide-wrapper').classList` — is `show` present?
2. Check Redux store: `getWrapperState(windowId, position)` — what are `visible` and `keepOpen`?
3. Check `getHotSpotStatus(windowId)` — is it "above" or "away"?
4. Check `IB(document)` — are there ghost popup elements?
5. Check `document.activeElement` — is it inside the wrapper?
6. Check if `.resizing` class exists on any child
