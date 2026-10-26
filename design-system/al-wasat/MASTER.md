# Design System Master File — AL WASAT

> **LOGIC:** When building a specific page, first check `design-system/al-wasat/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

**Project:** AL WASAT — premium Tunisian extra virgin olive oil
**Category:** E-commerce, heritage / agricultural
**Stack:** Static HTML + CSS + vanilla JS — no framework
**Theme:** Modern editorial (light). Shipped October 2026, replacing the
earlier dark ground / gold accent theme.

**Source of truth in code — three layers, loaded in this order:**

| File | Role |
|---|---|
| `styles.css` | Original base: layout, components, behaviour. Still dark-themed in places — never restyle here. |
| `assets/editorial.css` | Shared editorial layer for every page. Re-points the old tokens (`--ink`, `--cream`, `--gold`…) to the light palette and restyles shared components. |
| `assets/editorial-home.css` | Homepage composition only (`.home-page …`). |

New visual work goes in the editorial files, not `styles.css`.

---

## 1. Colour

Warm paper ground, near-black olive ink, one olive accent. No gold.

| Role | Token | Value |
|---|---|---|
| Page ground | `--editorial-paper` | `#faf9f5` |
| Raised band | `--ivory` / `--ink2` | `#f0f0e9` |
| Deeper band | `#eeefe7`, `#e8ebdf` | heritage, quote, newsletter |
| Primary text / buttons | `--editorial-ink` | `#20251e` |
| **Accent** | `--editorial-olive` | `#425139` |
| Secondary text | `--editorial-muted` | `#61665b` |
| Hairline | `--editorial-rule` | `rgb(32 37 30 / .22)` |

The legacy token names still exist because `styles.css` uses them; in the
editorial layer they resolve to the values above (`--gold` → olive,
`--cream` → ink, `--ink` → paper). Read `--gold` as "accent", not as a colour.

**Accent use:** kickers, links on hover, the second line of the hero title,
numerals, the trust strip band. Primary buttons are solid ink and turn olive
on hover.

---

## 2. Typography

System faces only — no web-font download for EN/FR.

| Token | Value | Use |
|---|---|---|
| `--serif` / `--display` | Georgia, 'Times New Roman', serif | headings, product names, pull quotes |
| `--body` | Arial, Helvetica, sans-serif | running text |
| `--tenor` | Arial, Helvetica, sans-serif | labels, prices, UI |

Arabic switches all three to **Noto Sans Arabic**, loaded on demand only when
AR is active. Blocks that exist only in English carry `lang="en" dir="ltr"`
and keep the Latin faces and left-to-right layout in Arabic mode.

- Headings: weight 600, tight negative tracking (`-.035em` to `-.065em`).
  Arabic resets tracking to 0 and opens line-height to ~1.35.
- Labels: uppercase, tracked `.06em`–`.15em`.
- Floor: nothing a customer must read below 12px (`0.75rem`).
- Italic only for emphasis (`<em>` in headings) — running text is roman.

---

## 3. Style

**Restrained editorial.** Flat surfaces, hairline rules, square corners,
generous whitespace, unboxed product photography (`object-fit: contain`, no
frames, no hover zoom).

**Removed deliberately — do not reintroduce:** marquee, custom cursor, grain
overlay, ambient glows, text-shadow on headings, GSAP page transitions, hero
video, heavy box-shadows.

### Motion

Micro-interactions 150–300ms. `prefers-reduced-motion` must land animated-in
elements in their **final** state — killing an entrance animation without this
leaves content permanently invisible. Lenis smooth scroll is off on phones and
under reduced motion.

---

## 4. Spacing & layout

- Horizontal gutter: `--section-x` = `clamp(1.25rem, 4.4vw, 5rem)`; phones
  `clamp(1rem, 4.6vw, 1.5rem)`.
- Section rhythm: `--section-y` = `clamp(4rem, 8vw, 8rem)`.
- Nav height: `--nav-h` 88px → 76px (≤1024px) → 68px (≤767px).
- Breakpoints: 1024 (drawer nav), 767 (phone), 600, 374/359 (small phones).

---

## 5. Page pattern (homepage)

```
hero            headline + CTA + proof figures | product photo + price
shop band       three starter products
heritage · process · quote
trust strip + trust band (certifications, lab figures)
reviews · newsletter · contact
```

---

## 6. Non-negotiables

- Contrast ≥ 4.5:1 for text.
- Touch targets ≥ 44×44 (buttons, nav links, language pill, footer links).
- Visible `:focus-visible` ring (2px olive, 4px offset) on every interactive element.
- Trust claims link to evidence or render as plain text. Placeholder
  `#TODO…` hrefs on `[data-verify]` links are stripped at runtime.
- No emoji as icons; SVG only.
- Every customer-facing string goes through `assets/translations.js`
  (`data-i18n`, `data-i18n-html`, `data-i18n-attr`, or `awT()` in JS).

---

## 7. Known debt

- `styles.css` (~2,900 lines) still holds the dark theme; the editorial layer
  overrides it, sometimes with `!important` (legal pages). Removing the dead
  dark rules needs cascade analysis — a past bulk merge broke ~200 computed styles.
- Journal articles, legal pages, the about facts and parts of trade are
  English-only.
- `#TODO` proof links await real certificate / lab-report URLs.
