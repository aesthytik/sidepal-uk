# Brand Identity Guidelines – UK Tech‑Visa Sponsor Finder

> **Version 1.0 · May 2025**
> These guidelines establish a cohesive visual & verbal identity inspired by the playful Glitch aesthetic, but re‑imagined in a fresh **blue‑mint tech palette** that conveys trust, innovation, and approachability.

---

## 1. Brand Essence

| Attribute         | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| **Mission**       | Make UK visa‑sponsored tech jobs instantly discoverable.    |
| **Personality**   | Helpful · Optimistic · Straight‑talking · Geeky‑cool.       |
| **Tone of Voice** | Plain English, short sentences, light humour. Avoid jargon. |
| **Tagline**       | “Find your UK tech sponsor in seconds.”                     |

---

## 2. Colour System

> All colours are AAA‑compliant on the given backgrounds.

| Token                   | HEX         | Role                               | Notes                             |
| ----------------------- | ----------- | ---------------------------------- | --------------------------------- |
| `--color‑primary‑500`   | **#3B5BFF** | Primary actions, links, highlights | Electric indigo (vs. Glitch pink) |
| `--color‑secondary‑500` | **#06B6D4** | Data accents, icons                | Bright aqua                       |
| `--color‑accent‑500`    | **#F472B6** | Call‑outs, playful stickers        | Soft coral                        |
| `--color‑highlight‑500` | **#FCD34D** | Badges, new tags                   | Lemon zest                        |
| `--color‑success‑500`   | **#34D399** | Success states                     | Mint                              |
| `--gray‑900`            | #0F172A     | Body text (dark mode bg)           | Slate 900                         |
| `--gray‑50`             | #F8FAFC     | Light mode panel bg                | Slate 50                          |

### Gradients

- **Light mode hero:** `linear-gradient(170deg, #E0F4FF 0%, #E9FDF4 100%)`
- **Dark mode hero:** `radial-gradient(circle at top right, #1E3A8A 0%, #0F172A 80%)`

### Accessibility

- Primary 500 on white: **4.6:1**
- Primary 700 (#2749F8) is available for small text if needed (>7:1).

---

## 3. Typography

| Style         | Font          | Size / Weight              | Usage           |
| ------------- | ------------- | -------------------------- | --------------- |
| **Display**   | Space Grotesk | 64 px / 700                | Landing hero H1 |
| **Heading 1** | Inter         | 40 px / 700                | Section titles  |
| **Heading 2** | Inter         | 28 px / 600                | Card titles     |
| **Body**      | Inter         | 18 px / 400                | Paragraphs      |
| **Caption**   | Inter         | 14 px / 400 + 0.4 tracking | Helper text     |

> **Fallback stack:** `ui‑sans‑serif, system‑ui, -apple-system, Segoe UI, sans‑serif`.

---

## 4. Logo & Iconography

- **Logo mark:** A stylised magnifying‑glass fused with UK map outline, set in primary 500.

  - **Clearspace:** 0.5× logo height on all sides.
  - **Min width:** 48 px digital, 12 mm print.

- **Favicon:** 32 × 32 SVG, aqua on transparent.
- **Icons:** Outline style, 2 px stroke, using Heroicons or Lucide. Stroke colour = `currentColor`.

---

## 5. UI Components (Key Specs)

| Component       | Surface / Border                                 | Radius  | Hover / Active                               |
| --------------- | ------------------------------------------------ | ------- | -------------------------------------------- |
| **Primary Btn** | `bg‑white / 1 px solid var(--color-primary-500)` | 6 px    | Fill primary 500, text white                 |
| **Ghost Btn**   | transparent / `1 px solid` gray‑200              | 6 px    | Tint gray‑100                                |
| **Card**        | white panel, `2 px solid #E5E7EB`                | 8 px    | Shadow `0 4px 8px rgba(0,0,0,.04)` lift 4 px |
| **Tag / Chip**  | `bg‑gray‑100` / none                             | 9999 px | Darken bg 6 %                                |

Motion: fade‑up + scale(1.02) **200 ms ease‑out** on hover for Cards; section reveal 400 ms using Framer Motion.

---

## 6. Illustration & Imagery

- Style: Minimal, flat vectors with subtle inner glows in secondary / accent colours.
- Hero element: Rotated rhombus prism outlined in primary 500, soft aqua glow.
- People illustrations: Inclusive, faceless characters in pastel clothing (avoid Glitch’s cartoon sprites but keep playfulness).

---

## 7. Layout & Spacing

- Base grid: **12‑col, 72 px max content width on desktop, 24 px gutters**.
- Spacing scale (4‑pt): `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`.
- Sections stack with **96 px** top/bottom on desktop, **56 px** on mobile.

---

## 8. Dark Mode

- Activate via `class="dark"`.
- Background: `#0F172A` → `#1E293B` gradient.
- Card surface: `#1E293B`, border `#334155`.
- Text: `#F1F5F9`.
- Primary & accent colours stay the same for brand recognition but shift to _700 hues_ if added contrast is needed.

---

## 9. Voice & Copy Examples

> **Headline:** “Unlock UK Tech Opportunities.”
> **Body:** “Search 130 000+ licensed sponsors, filter by sector, and apply directly. No fluff. Just the data you need.”
> **Microcopy:** Buttons use verbs: “Search”, “Save”, “View Careers”. Toasts: “Copied!” not “Copy was successful”.

---

## 10. Code Snippets

### Tailwind Config Accent Palette

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#3B5BFF",
          600: "#2749F8",
          700: "#1E3AF1",
        },
        secondary: "#06B6D4",
        accent: "#F472B6",
        highlight: "#FCD34D",
        success: "#34D399",
      },
      borderRadius: {
        card: "8px",
      },
    },
  },
};
```

### CSS Custom Properties (for non‑Tailwind areas)

```css
:root {
  --color-primary-500: #3b5bff;
  --color-secondary-500: #06b6d4;
  --color-accent-500: #f472b6;
  --color-highlight-500: #fcd34d;
  --radius-card: 8px;
}
```

---

## 11. Don’ts

- Don’t reuse Glitch’s pink gradient (#F8D1F5) – always swap to blue‑mint.
- Don’t pair primary 500 with accent 500 text on the same line (insufficient contrast).
- Avoid stock photos with watermarks or corporate clichés (handshakes, skyscrapers).

---

## 12. Assets Repository

| Asset            | Path                           | Notes                  |
| ---------------- | ------------------------------ | ---------------------- |
| Logos (SVG, PNG) | `/assets/brand/logo/`          | Dark & light variants  |
| Illustrations    | `/assets/brand/illustrations/` | Hero prism, characters |
| Icon set         | `/assets/brand/icons/`         | 24 px stroke, .svg     |
| Favicon          | `/public/favicon.svg`          | Monochrome aqua        |

---

### Need changes?

Open a ticket in _Design > Brand_ Jira board or ping `@design-lead` in Slack. This document is the single source of truth until superseded.
