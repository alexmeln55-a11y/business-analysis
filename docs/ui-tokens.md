# UI Tokens

All implementation must reference these tokens.
Do not use raw hex values or pixel values directly in component code.

---

## Colors

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| bg-canvas | #0B0908 | Page background |
| bg-panel | #1A1613 | Cards, panels, modals |
| bg-panel-raised | #221C18 | Elevated surfaces within panels |
| bg-overlay | rgba(11,9,8,0.72) | Modal backdrops, overlays |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| text-primary | #F4EDE3 | Body text, headings, labels |
| text-secondary | #CDBEAE | Supporting text, subtitles |
| text-muted | #9B8A7A | Metadata, placeholders, disabled labels |
| text-on-accent | #0B0908 | Text placed on copper accent backgrounds |

### Accent
| Token | Value | Usage |
|-------|-------|-------|
| accent-copper | #B57A56 | Default accent — borders, icons, indicators |
| accent-copper-strong | #D09062 | Hover state, CTA, active score indicator |
| accent-copper-subtle | rgba(181,122,86,0.12) | Selected row background, focus ring fill |

### Functional
| Token | Value | Usage |
|-------|-------|-------|
| border-default | rgba(244,237,227,0.08) | Subtle dividers, card borders |
| border-active | #B57A56 | Active input, selected card border |
| error-subtle | rgba(180,60,50,0.18) | Error state background |
| error-text | #D97060 | Error message text |

---

## Typography

### Font families
| Token | Value | Usage |
|-------|-------|-------|
| font-sans | 'Inter', 'Helvetica Neue', sans-serif | All body and UI text |
| font-serif | 'Georgia', 'Times New Roman', serif | Large display headings only (optional) |
| font-mono | 'JetBrains Mono', 'Fira Code', monospace | Code, IDs, technical values |

### Font sizes
| Token | Value | Usage |
|-------|-------|-------|
| text-xs | 12px | Timestamps, secondary metadata |
| text-sm | 14px | Labels, captions, helper text |
| text-base | 16px | Body text, form inputs |
| text-md | 18px | Card body, emphasis text |
| text-lg | 22px | Section headings, card titles |
| text-xl | 28px | Page headings |
| text-2xl | 36px | Hero headings, score display |
| text-3xl | 48px | Large numeric display (scores) |

### Font weights
| Token | Value | Usage |
|-------|-------|-------|
| weight-regular | 400 | Body text |
| weight-medium | 500 | Labels, UI elements |
| weight-semibold | 600 | Card titles, section headings |
| weight-bold | 700 | Page headings, key scores |

### Line heights
| Token | Value | Usage |
|-------|-------|-------|
| leading-tight | 1.2 | Headings, large display text |
| leading-snug | 1.35 | Card titles, labels |
| leading-normal | 1.5 | Body text |
| leading-relaxed | 1.65 | Long-form content, explanations |

### Letter spacing
| Token | Value | Usage |
|-------|-------|-------|
| tracking-tight | -0.02em | Large headings |
| tracking-normal | 0 | Body text |
| tracking-wide | 0.06em | Small caps, metadata labels |

---

## Spacing

8-point scale. Use only these values.

| Token | Value |
|-------|-------|
| space-1 | 8px |
| space-2 | 12px |
| space-3 | 16px |
| space-4 | 24px |
| space-5 | 32px |
| space-6 | 48px |
| space-7 | 64px |
| space-8 | 96px |

---

## Border radius

| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | 14px | Inputs, tags, small elements |
| radius-md | 18px | Buttons, form fields |
| radius-lg | 24px | Cards, panels |
| radius-xl | 32px | Modal containers, large cards |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| shadow-soft | 0 12px 40px rgba(0,0,0,0.26) | Default card elevation |
| shadow-deep | 0 24px 80px rgba(0,0,0,0.42) | Modals, elevated panels |
| shadow-inset | inset 0 1px 0 rgba(244,237,227,0.05) | Top edge on dark panels |

---

## Layout

| Token | Value | Usage |
|-------|-------|-------|
| max-width-content | 720px | Body text, form columns |
| max-width-page | 1100px | Full page container |
| page-padding-x | 24px (mobile), 48px (desktop) | Horizontal page margin |
| page-padding-y | 48px | Vertical page margin |
