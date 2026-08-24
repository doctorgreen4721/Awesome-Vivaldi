# Vivaldi CSS Variables Reference

Vivaldi exposes theme-aware CSS custom properties on `#browser` (or `:root`). These follow the user's active theme and are safe to use in CSS mods. **Record variable names only** — values change with theme.

## Background (colorBg series)

| Variable | Typical role |
|---|---|
| `--colorBg` | Main background |
| `--colorBgAlpha` / `--colorBgAlphaHeavy` / `--colorBgAlphaHeavier` | Semi-transparent bg layers |
| `--colorBgAlphaBlur` | Backdrop-blur bg |
| `--colorBgDark` / `--colorBgDarker` | Darkened bg |
| `--colorBgLight` / `--colorBgLighter` / `--colorBgLightIntense` | Lightened bg |
| `--colorBgIntense` / `--colorBgIntenser` | Intense bg |
| `--colorBgInverse` / `--colorBgInverser` | Inverse bg |
| `--colorBgFaded` | Faded bg |

## Foreground (colorFg series)

| Variable | Typical role |
|---|---|
| `--colorFg` | Primary text |
| `--colorFgAlpha` | Semi-transparent text |
| `--colorFgIntense` | High-contrast text |
| `--colorFgFaded` / `--colorFgFadedMore` / `--colorFgFadedMost` | Diminished text |

## Highlight (colorHighlightBg series)

These are the **primary accent / brand colors** — the most prominent color in the theme.

| Variable | Typical role |
|---|---|
| `--colorHighlightBg` | Highlight/selection background |
| `--colorHighlightBgFaded` | Faded highlight |
| `--colorHighlightBgAlpha` | Semi-transparent highlight |
| `--colorHighlightBgDark` | Darkened highlight |
| `--colorHighlightFg` | Text on highlight |
| `--colorHighlightFgAlpha` / `--colorHighlightFgAlphaHeavy` | Semi-transparent text on highlight |

## Accent (colorAccentBg series)

These are **secondary accent colors** — more subtle than highlight, often used for inactive/background accent.

| Variable | Typical role |
|---|---|
| `--colorAccentBg` | Accent background |
| `--colorAccentBgAlpha` / `--colorAccentBgAlphaHeavy` / `--colorAccentBgAlphaBlur` | Semi-transparent accent |
| `--colorAccentBgDark` / `--colorAccentBgDarker` | Darkened accent |
| `--colorAccentBgFaded` / `--colorAccentBgFadedMore` / `--colorAccentBgFadedMost` | Faded accent |
| `--colorAccentBorder` / `--colorAccentBorderDark` | Accent borders |
| `--colorAccentFg` / `--colorAccentFgFaded` | Text on accent |
| `--colorAccentFgAlpha` / `--colorAccentFgAlphaHeavy` | Semi-transparent text on accent |

## Border

| Variable | Typical role |
|---|---|
| `--colorBorder` | Default border |
| `--colorBorderDisabled` | Disabled border |
| `--colorBorderSubtle` | Subtle border |
| `--colorBorderIntense` | Intense border |

## Semantic colors

| Variable | Typical role |
|---|---|
| `--colorSuccessBg` / `--colorSuccessBgAlpha` / `--colorSuccessFg` | Success state |
| `--colorWarningBg` / `--colorWarningBgAlpha` / `--colorWarningFg` | Warning state |
| `--colorErrorBg` / `--colorErrorBgAlpha` / `--colorErrorFg` | Error state |

## Radius

| Variable |
|---|
| `--radius` / `--radiusHalf` / `--radiusCap` / `--radiusRound` / `--radiusRounded` / `--radiusRoundedLess` / `--radiusWindow` |

## Other

| Variable | Typical role |
|---|---|
| `--colorTabBar` | Tab bar background |
| `--densityGap` | Layout density gap |
| `--scrollbarWidth` | Scrollbar width |
| `--monospaceFont` | Monospace font family |
| `--sansSerifFont` | Sans-serif font family |
| `--uiZoomLevel` | UI zoom multiplier |

> **Note:** These variables are read from `element.style` on `#browser` at runtime. They are Vivaldi's own theme system — do not redefine them, only reference them via `var()`.
