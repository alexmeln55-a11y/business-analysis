# Page Templates

These templates define the layout structure, components, and required data fields
for each core MVP screen. They are implementation-agnostic — no framework assumed.

All screens share:
- Background: `bg-canvas`
- Max page width: `max-width-page` (1100px)
- Horizontal padding: `page-padding-x`
- Font: `font-sans`

---

## 1. Founder Intake

**Purpose:** Collect and save the founder profile. First screen in the flow.

### Layout

```
[Page header — product name + nav]
[Page title: "Your Profile"]
[Subtitle: brief explanation of why this matters]

[Two-column layout on desktop / single column on mobile]
  [Left: form fields]
  [Right: guidance panel — sticky]

[Bottom bar: Save / Update actions]
```

### Components

| Component | Token references | Notes |
|-----------|-----------------|-------|
| Page title | text-xl, weight-bold, text-primary | |
| Subtitle | text-base, text-secondary, leading-relaxed | Max 2 lines |
| Form section heading | text-sm, weight-semibold, tracking-wide, text-muted | Uppercase label style |
| Text input | bg-panel, border-default, radius-sm, text-base, text-primary | Focus: border-active |
| Multi-select tag input | bg-panel-raised, radius-sm, accent-copper-subtle | For arrays (skills, domains) |
| Range / select | bg-panel, border-default, radius-sm | For enums (tolerances) |
| Guidance panel | bg-panel, radius-lg, shadow-soft, space-4 padding | Right column |
| Save button | accent-copper, radius-md, weight-semibold, text-on-accent | Primary CTA |
| Update button | border-active, radius-md, weight-semibold, accent-copper | Secondary CTA |

### Required data fields (from founder-profile.v1)

| Field | Input type | Validation |
|-------|-----------|------------|
| name | text | required |
| experience_domains | tag-input (array) | required, min 1 |
| skills | key-value pairs (map) | required, enum values per skill |
| distribution_access | tag-input (array) | required, min 1 |
| preferred_models | multi-select | optional |
| time_horizon_months | number input | required, min 1 |
| manual_work_tolerance | select (low/medium/high) | required |
| sales_cycle_tolerance | select (short_only/medium_ok/long_ok) | required |

### States
- Empty (first visit): all fields blank, guidance panel shows onboarding copy
- Partially filled: inline validation on blur
- Saved: confirmation indicator on Save button, no page redirect

---

## 2. Signal Review

**Purpose:** Browse and inspect market signals. Used to understand what pain evidence exists.

### Layout

```
[Page header]
[Page title: "Market Signals"]
[Filter bar — horizontal]

[Two-column layout]
  [Left: signal list / table]
  [Right: detail preview panel — updates on row select]
```

### Components

| Component | Token references | Notes |
|-----------|-----------------|-------|
| Page title | text-xl, weight-bold, text-primary | |
| Filter bar | bg-panel, radius-sm, border-default | Source type, urgency, evidence strength |
| Signal row | bg-panel, radius-md, border-default | Hover: bg-panel-raised |
| Signal row — selected | border-active, accent-copper-subtle bg | |
| Evidence badge | text-xs, tracking-wide, accent-copper | Inline label: STRONG / WEAK etc. |
| Urgency indicator | text-sm, weight-medium | Color from functional tokens |
| Detail preview panel | bg-panel, radius-lg, shadow-soft, space-5 padding | Sticky right column |
| Empty state | text-secondary, text-md, centered | Shown when no signals match filter |

### Required data fields (from market-signal.normalized.v1)

| Field | Display element | Notes |
|-------|----------------|-------|
| audience | row subtitle | |
| problem | row title | Truncate at 2 lines in list |
| evidence_strength | badge | Enum label |
| frequency | badge | Enum label |
| urgency | indicator | Enum label |
| current_workaround | detail panel | Full text |
| confidence | detail panel | Shown as 0.0–1.0 |
| source_type | detail panel | |
| normalized_at | detail panel | Date only |

### States
- Default: all signals, no filter active
- Filtered: filtered count shown in filter bar
- Signal selected: detail panel populated
- No results: empty state with reset filter action

---

## 3. Opportunity Shortlist

**Purpose:** Show the scored shortlist of opportunities. Primary output surface of the product.

### Layout

```
[Page header]
[Page title: "Opportunities"]
[Sort / filter bar]

[Card grid — 1 column on mobile, 2 on tablet, 2 on desktop (cards are wide)]

[Each card: OpportunityCard summary]
```

### Components

| Component | Token references | Notes |
|-----------|-----------------|-------|
| Page title | text-xl, weight-bold, text-primary | |
| Sort bar | text-sm, text-secondary | Sort by: overall score, confidence, entry mode |
| Opportunity card | bg-panel, radius-lg, shadow-soft, space-5 padding | |
| Card title | text-lg, weight-semibold, text-primary | |
| Card audience | text-sm, text-secondary | |
| Overall score | text-3xl, weight-bold, accent-copper-strong | Displayed large |
| Score label | text-xs, tracking-wide, text-muted | "OVERALL SCORE" beneath number |
| Score bar row | 4 mini bars (market / founder / pattern / entry) | Each labeled, copper fill |
| Confidence | text-sm, text-muted | "Confidence: 0.82" |
| Entry mode badge | text-xs, bg-panel-raised, radius-sm, accent-copper | |
| View detail CTA | text-sm, weight-medium, accent-copper | Inline link or button |
| Empty state | text-secondary, text-md, centered | When no opportunities scored yet |

### Required data fields (from opportunity-card.v1)

| Field | Display element |
|-------|----------------|
| title | card title |
| audience | card subtitle |
| overall_score | large score display |
| pain_score | score bar — market |
| founder_fit_score | score bar — founder |
| pattern_score | score bar — pattern |
| entry_feasibility_score | score bar — entry |
| confidence | confidence label |
| recommended_entry_mode | entry mode badge |

### States
- Default: sorted by overall_score descending
- Filtered: filter count shown
- Empty: empty state panel with link to start intake flow

---

## 4. Opportunity Detail

**Purpose:** Full view of a single opportunity card. Decision surface for the founder.

### Layout

```
[Page header + back navigation]
[Page title: opportunity title]
[Subtitle: audience]

[Two-column layout on desktop / single column on mobile]
  [Left: main content — summary, scores, risks, entry]
  [Right: action panel — first offer, first test, confidence]

[Section: Score Breakdown]
[Section: Why This / Why Now]
[Section: Risks]
[Section: First Offer]
[Section: First Test]
```

### Components

| Component | Token references | Notes |
|-----------|-----------------|-------|
| Page title | text-xl, weight-bold, text-primary | |
| Audience subtitle | text-base, text-secondary | |
| Summary block | text-md, leading-relaxed, text-primary | 1–2 paragraphs |
| Why now block | text-base, leading-relaxed, text-secondary | |
| Score row | label + number + bar | One row per component score |
| Overall score display | text-3xl, weight-bold, accent-copper-strong | |
| Confidence note | text-sm, text-muted | Always shown with score |
| Risk item | text-base, text-primary, bullet | One per risk in array |
| Section heading | text-sm, weight-semibold, tracking-wide, text-muted | Uppercase style |
| First offer box | bg-panel-raised, radius-lg, space-4 padding | |
| First test box | bg-panel-raised, radius-lg, space-4 padding | |
| Entry mode badge | accent-copper, radius-sm, text-sm | |
| Back navigation | text-sm, text-muted, accent-copper on hover | |

### Required data fields (from opportunity-card.v1)

| Field | Display element |
|-------|----------------|
| title | page title |
| audience | subtitle |
| problem | summary section |
| overall_score | large score |
| pain_score | score row |
| founder_fit_score | score row |
| pattern_score | score row |
| entry_feasibility_score | score row |
| confidence | confidence note |
| risks | risk list |
| recommended_entry_mode | entry mode badge |
| first_offer | first offer box |
| first_test | first test box |
| willingness_to_pay | score row context |

### States
- Loaded: all sections populated
- Low confidence: confidence note styled with text-muted warning copy
- Missing field: section shows "Not available" in text-muted (never hidden silently)
