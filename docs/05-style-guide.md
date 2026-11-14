# pocket Style Guide

Use this guide for the Android app, Figma frames, slides, and future screens. The token source for the app is `www/css/style.css`.

## Visual character

Friendly, steady, and practical. Use a warm paper background, deep navy for trust and hierarchy, clear blue for actions, and small gold accents for progress. Reserve red for an actual over-budget state. Keep screens airy, with one obvious primary action.

## Type

| Use | Typeface | Size / weight |
|---|---|---|
| Display headings | Georgia, serif | 29–37 px, regular (500) |
| Dashboard heading | Georgia, serif | 27–34 px, regular (500) |
| Card and section heading | System sans-serif | 14–21 px, bold (700) |
| Body and controls | Inter when installed; system sans-serif fallback | 12–16 px, regular (400–600) |
| Field labels / overlines | System sans-serif, uppercase | 9–11 px, bold (700), slight tracking |
| Supporting text | System sans-serif | 10–12 px, regular (400) |

Use sentence case for headings and buttons. Avoid long blocks of all-caps text.

## Color tokens

| Token | Hex | Use |
|---|---|---|
| Paper | `#F7F6F2` | Main app background |
| White | `#FFFFFF` | Cards and controls |
| Navy | `#0C2E50` | Primary headings, balance cards |
| Ink | `#132D47` | Main text |
| Blue | `#1760A8` | Main actions, links, charts |
| Blue soft | `#EAF3FB` | Selected states and suggestions |
| Muted | `#596B7D` | Secondary text |
| Line | `#E0E5E9` | Dividers and tracks |
| Gold | `#EFB231` | Progress and attention |
| Red | `#BD4038` | Over-budget state and errors |
| Red soft | `#FBEDEB` | Error / alert surface |
| Canvas | `#E9EBED` | Desktop surround only |
| Focus | `#78A9DC` | Visible keyboard focus ring |

Use red only to communicate an issue. Pair every colored status with a label or explanation.

## Shape, spacing, and elevation

| Token | Value | Typical use |
|---|---:|---|
| Space 1 | 4 px | Icon/text alignment |
| Space 2 | 8 px | Tight control gaps |
| Space 3 | 12 px | Compact card content |
| Space 4 | 16 px | Standard component padding |
| Space 5 | 20 px | Card padding and section rhythm |
| Space 6 | 24 px | Screen side inset |
| Space 8 | 32 px | Major section separation |
| Radius small | 9 px | Inputs and compact controls |
| Radius medium | 14 px | Chips and small panels |
| Radius large | 20 px | Cards |
| Radius extra large | 28 px | App shell on desktop preview |

Use a 24 px mobile screen inset (17 px on widths up to 360 px). Keep tap targets at least 44 × 44 px. Use a single soft shadow around the desktop phone preview; mobile cards rely on white surfaces and spacing rather than heavy shadows.

## Components

- **Primary button:** blue fill, white bold text, 44 px minimum height, 12–14 px radius. One main action per screen.
- **Secondary button:** white or transparent fill, 1 px line, blue text.
- **Input:** white/paper surface, 1 px line, clear label above. Keep the currency symbol visible beside amount entry.
- **Card:** white surface, 18–20 px radius, 16–20 px padding.
- **Weekly balance card:** navy surface; use gold for its meter. Switch to red only when the weekly balance is negative.
- **Category icon:** tinted soft square/circle with a readable single glyph; do not rely on emoji to carry category meaning.
- **Navigation:** fixed bottom bar with five destinations. Active item uses blue text and a soft-blue icon background. Center Add is the primary shortcut.
- **Alert:** red label, red-tinted balance summary, plain-language explanation, and a recovery action.
- **Focus state:** 3 px focus outline with 3 px offset. Never remove keyboard focus without providing another visible state.

## Layout and accessibility

- Design for a 360–430 px wide phone first. Keep the page vertically scrollable above a persistent bottom bar.
- Respect Android safe areas. Avoid placing text or controls under the status and navigation bars.
- Preserve a 4.5:1 contrast target for normal text where practical; verify final combinations in the implementation.
- Use visible labels, descriptive button names, and text alongside chart colors.
- Respect reduced-motion preferences. Keep transitions short and non-essential.
- Use the user's local currency and date formatting in all examples; this project currently uses INR.

## CSS token reference

`www/css/style.css` defines `--paper`, `--navy`, `--blue`, `--ink`, `--muted`, `--line`, `--gold`, `--red`, the spacing tokens `--space-1` through `--space-8`, the radius tokens, `--font-ui`, and `--font-display`. Reuse these variables rather than introducing one-off colors or spacing values.

## Ready-to-post group summary

> **pocket style guide:** Georgia for large headings; system sans-serif for UI and body. Warm paper `#F7F6F2`, navy `#0C2E50`, action blue `#1760A8`, gold `#EFB231` for progress, red `#BD4038` for overspending only. Use 4/8/12/16/20/24/32 px spacing, 9/14/20 px corner radii, 24 px mobile side padding, and 44 px minimum tap targets. Keep the weekly balance as the main focus; use sentence-case copy and pair status colors with text.
