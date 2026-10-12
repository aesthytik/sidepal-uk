# Horus brand guidelines

> Version 2.0 · October 2026. Replaces the 2025 "blue-mint tech" palette.

Horus helps people find UK employers that can sponsor their work visa. The people using it are often anxious and
reading a lot, so the brand is **calm editorial**: warm paper, near-black ink, one deep green accent. It should feel like
a well-made reference book, not a dashboard.

## Essence

| Attribute | Description |
| --- | --- |
| Mission | Make every UK visa sponsor, and the jobs they're hiring for, easy to find. |
| Personality | Calm, trustworthy, plain-spoken, quietly playful. |
| Voice | Short sentences, plain English, no hype. A little warmth (Horus the eye, the occasional joke) but never at the expense of clarity. |
| Tagline | "Stop searching blind." |

## Colour

All colours are CSS variables in `src/app/globals.css`, exposed to Tailwind as `background`, `foreground`, `primary`,
`muted`, `accent`, `border`, `gold`, `clay` and `sage`. Never hard-code hex values in components (the only exceptions
are canvas and image code, which can't read CSS variables; those use the hex values below).

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Background (paper) | `#F6F3EC` | `#161513` | Page background |
| Card | `#FBF9F4` | `#1E1D1A` | Cards, inputs, menus |
| Foreground (ink) | `#1A1A17` | `#ECE7DD` | Body text, headings |
| Muted text | `#6B675E` | `#A39E92` | Secondary text, labels |
| Border | `#E2DDD2` | `#2E2C28` | Hairlines, dividers |
| Primary (green) | `#1F5C4A` | `#7FB59C` | Links, primary buttons, focus ring |
| Accent tint | `#E6EFEA` | `#22302A` | Selected and highlighted surfaces |
| Gold | `#8A6A22` | `#D4B36A` | Legendary finds, achievements, warnings |
| Clay | `#9C4E35` | `#D98A6E` | Errors, destructive actions, red tape |
| Sage | `#3F6F58` | `#8FC2A9` | Success, XP, A-rated |

Every text/background pair above meets WCAG AA (4.5:1) in its theme; most exceed 7:1. Check new pairs before using
them. Use colour sparingly: most of the page should be ink on paper, with green for the one thing you want clicked.

## Type

- **Display: Fraunces** (serif, variable; `font-display`). Headlines at weight 600; use the italic for the second, quieter
  half of a headline ("Stop searching blind. *Find UK jobs that can sponsor your visa.*"). No tight tracking.
- **Body: Inter** (`font-sans`). 16px base, relaxed line height for paragraphs, `tabular-nums` for counts.
- Eyebrows: 12px, semibold, uppercase, 0.16em tracking, muted colour (`.eyebrow`).

## Shape and depth

- Radius 0.5rem (`--radius`); buttons, inputs and chips use `rounded-md`. No pills except tiny status dots.
- Structure comes from hairline borders and whitespace, not shadows. Shadows only on floating layers (menus, toasts).
- No gradients, glows, glassmorphism or offset "sticker" shadows.

## Mark and mascot

- The mark is the Eye of Horus on a deep green rounded square (`src/app/icon.svg`): a paper-white eye, a green iris, an ink
  pupil and the curled tear-line. Generated images (`opengraph-image.tsx`, `twitter-image.tsx`, `apple-icon.tsx`)
  share the drawing in `src/app/_brand/mark.tsx`.
- **Horus the mascot** (`src/components/game/Horus.tsx`) is the mark come to life. On desktop the iris follows the pointer,
  clipped to the eye. He blinks, dozes when ignored and reacts to saves, empty results and level-ups. Keep his moves
  small and slow; he should never be the loudest thing on screen.

## Motion

- Short and soft: 150 to 500ms ease-out, small distances (4 to 8px). No bounce, spin, tilt or flashing.
- Calm mode (HUD toggle) and `prefers-reduced-motion` turn off all decorative motion, confetti and sound.

## The game layer

XP, levels, achievements, the Quest Board and Stamp Rush use the same palette: gold for rewards, sage for XP, clay for
setbacks. Rarity on sponsor cards is a small coloured label (Rare, Epic, ★ Legendary), never a light show. The Konami
code's arcade skin is the one place the rules relax, and only because you asked for it.
