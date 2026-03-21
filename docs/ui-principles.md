# UI Principles

## Style identity
Warm dark editorial product UI.
Not a SaaS dashboard. Not a consumer app.
A focused tool that respects the user's intelligence and time.

---

## Background and surface

- Canvas is near-black with a warm undertone, not pure black (`bg-canvas: #0B0908`).
- Panels and cards sit one step lighter (`bg-panel: #1A1613`).
- Never use pure `#000000` or pure `#ffffff`.
- Depth is created through layering warm-tinted surfaces, not harsh borders.
- Borders are used sparingly — prefer surface contrast over border lines.

---

## Typography

- Text is cream, not white. Primary text at `#F4EDE3`, secondary at `#CDBEAE`, muted at `#9B8A7A`.
- Font is a humanist sans-serif for body; an editorial serif may be used for headings at large scale.
- Hierarchy is established through weight and size — not color shifts or decoration.
- Line length is constrained (60–72 chars for body) to preserve readability.
- Never use font sizes below 14px in functional UI.
- Labels and metadata use text-muted. Interactive elements use text-primary.

---

## Accent and emphasis

- Copper (`#B57A56`, `#D09062`) is the single accent color.
- Copper is used for: active states, score indicators, key data points, CTAs.
- Copper is not used as a background fill on large areas.
- No other accent colors. No blue links, no green success banners, no red alerts as filled blocks.
- Error states use a desaturated warm red at low opacity, not saturated red.

---

## Spacing and layout

- Spacing follows the 8-point scale: 8, 12, 16, 24, 32, 48, 64, 96.
- Page content has a max-width to preserve line length and focus.
- Sections are separated by spacing, not dividers.
- Cards use `radius-lg` (24px). Inputs and smaller elements use `radius-sm` (14px).
- Avoid tight spacing between interactive elements — minimum 12px between tap targets.

---

## Components and interaction

- Components have three states minimum: default, hover, active/selected.
- Hover states use slight surface lightening — not color changes.
- Active/selected states use copper accent on the relevant element.
- Disabled states use `text-muted` with reduced opacity (50%).
- No tooltips as the primary information mechanism — content should be self-explanatory.

---

## Data and scores

- Scores are shown as numbers, not only bars or icons.
- Score ranges are always visible in context (e.g. "0.74 / 1.0").
- Confidence is always shown alongside a score.
- Weak evidence is always surfaced — never hidden to look cleaner.
- Score components (market, founder fit, pattern, entry feasibility) are individually visible.

---

## What to avoid

- Gradient backgrounds or glassmorphism effects.
- Multiple typeface families.
- Color-coded status badges as the only information carrier.
- Charts or graphs as decoration.
- Animations beyond simple opacity/translate transitions.
- Random spacing values outside the 8-point scale.
- Anything that reads as "SaaS dashboard" or "startup landing page".
