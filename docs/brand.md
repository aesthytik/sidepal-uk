# Horus — quiet, editorial, calm

## Concept and personality

**Big plans. Clear next steps.** Horus is a calm, capable companion for a serious job search. The look is editorial: large, light serif headlines, a clean grotesk for reading, near-white and cool-grey surfaces, charcoal for primary actions and a single cobalt accent. Soft pastel panels (mint, lavender, grey) group related actions. The eye badge is a charcoal rounded square with a cobalt iris, recognisable at favicon size. Official data, honest caveats and clear controls provide trust.

We are curious, capable and warm. Celebrate actions people can control: researching, saving, applying and preparing. Avoid promises about getting a visa, pressure about streaks, jokes about rejection or treating immigration problems as a punchline. Progress is encouragement, never a measure of someone's worth.

## History

- 2026-10 (current): moved from the violet "next chapter" identity (Space Grotesk, hard offset shadows, stickers) to an editorial system. Same tokens and component API; new values, fonts, radii and soft shadows.
- Earlier: forest-green paper/ink identity with Fraunces and Inter.

## Colour tokens

These HSL channels are the source values in `src/app/globals.css`, consumed as `hsl(var(--token))` and exposed through Tailwind. The theme follows the operating system. `gold`, `clay` and `sage` retain their existing API names for reward/warning, error/setback and success. Mint and apricot are paired surfaces, not body-text colours. `border` is a decorative separator; use `input` for control boundaries and `ring` for focus.

```css
:root {
  --background: 0.0 0.0% 98.8%; /* #FCFCFC */
  --foreground: 222.9 13.7% 10.0%; /* #16181D */
  --card: 0.0 0.0% 100.0%; /* #FFFFFF */
  --card-foreground: 222.9 13.7% 10.0%; /* #16181D */
  --primary: 219.9 68.2% 48.0%; /* #275FCE */
  --primary-foreground: 0.0 0.0% 100.0%; /* #FFFFFF */
  --muted: 180.0 6.2% 93.7%; /* #EEF0F0 */
  --muted-foreground: 205.7 7.3% 37.6%; /* #596167 */
  --accent: 240.0 63.0% 94.7%; /* #E9E9FA */
  --accent-foreground: 230.5 57.6% 38.8%; /* #2A3C9C */
  --destructive: 354.3 62.2% 43.5%; /* #B42A37 */
  --destructive-foreground: 0.0 0.0% 100.0%; /* #FFFFFF */
  --border: 204.0 9.8% 90.0%; /* #E3E6E8 */
  --input: 205.7 6.1% 55.3%; /* #868E94 */
  --ring: 219.9 68.2% 48.0%; /* #275FCE */
  --gold: 38.5 76.8% 27.1%; /* #7A5410 */
  --clay: 354.3 62.2% 43.5%; /* #B42A37 */
  --sage: 129.8 40.4% 29.6%; /* #2D6A37 */
  --mint: 136.4 45.8% 90.6%; /* #DCF2E2 */
  --mint-foreground: 115.7 34.1% 16.1%; /* #1D371B */
  --apricot: 32.6 66.0% 89.6%; /* #F6E6D3 */
  --apricot-foreground: 30.0 55.2% 22.7%; /* #5A3A1A */
  --map-water: 223.8 59.1% 91.4%; /* #DCE3F6 */
  --map-land: 180.0 6.7% 97.1%; /* #F7F8F8 */
  --map-park: 136.7 36.0% 90.2%; /* #DDEFE2 */
  --map-road: 0.0 0.0% 100.0%; /* #FFFFFF */
  --map-road-casing: 213.3 12.0% 85.3%; /* #D5D9DE */
  --radius: 1.5rem;
  --shadow-card: 0 1px 2px hsl(var(--foreground) / 0.04), 0 10px 30px -18px hsl(var(--foreground) / 0.18);
  --shadow-float: 0 18px 48px -20px hsl(var(--foreground) / 0.28);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 210.0 10.5% 7.5%; /* #111315 */
    --foreground: 200.0 8.6% 93.1%; /* #ECEEEF */
    --card: 214.3 11.9% 11.6%; /* #1A1D21 */
    --card-foreground: 200.0 8.6% 93.1%; /* #ECEEEF */
    --primary: 221.2 100.0% 78.0%; /* #8FB2FF */
    --primary-foreground: 222.7 63.4% 13.9%; /* #0D1A3A */
    --muted: 210.0 10.5% 14.9%; /* #22262A */
    --muted-foreground: 207.7 8.2% 68.8%; /* #A9B0B6 */
    --accent: 231.2 32.7% 20.4%; /* #232845 */
    --accent-foreground: 228.9 100.0% 89.4%; /* #C9D3FF */
    --destructive: 3.4 100.0% 82.9%; /* #FFADA8 */
    --destructive-foreground: 357.1 56.8% 14.5%; /* #3A1012 */
    --border: 210.0 9.8% 20.0%; /* #2E3338 */
    --input: 208.0 6.1% 48.0%; /* #737B82 */
    --ring: 221.2 100.0% 78.0%; /* #8FB2FF */
    --gold: 40.0 73.0% 71.0%; /* #EBC77F */
    --clay: 3.4 100.0% 82.9%; /* #FFADA8 */
    --sage: 133.7 47.9% 71.4%; /* #93D9A3 */
    --mint: 140.0 30.3% 17.5%; /* #1F3A28 */
    --mint-foreground: 134.3 53.5% 83.1%; /* #BDEBC8 */
    --apricot: 29.2 38.1% 19.0%; /* #43301E */
    --apricot-foreground: 31.4 79.7% 84.5%; /* #F7D9B8 */
    --map-water: 221.5 30.2% 16.9%; /* #1E2638 */
    --map-land: 210.0 12.0% 9.8%; /* #16191C */
    --map-park: 144.7 22.7% 14.7%; /* #1D2E24 */
    --map-road: 212.3 10.1% 25.3%; /* #3A4047 */
    --map-road-casing: 210.0 12.5% 6.3%; /* #0E1012 */
    --shadow-card: 0 1px 0 hsl(0 0% 100% / 0.04) inset, 0 10px 30px -18px hsl(0 0% 0% / 0.6);
  }
}
```

Keep normal text at least 4.5:1 and meaningful control boundaries at least 3:1. Computed WCAG sRGB ratios for the core token pairs (rounded only for display):

| Text / surface | Light | Dark |
| --- | --- | --- |
| `foreground` on `background` | 17.31:1 | 16.00:1 |
| `card-foreground` on `card` | 17.76:1 | 14.53:1 |
| `muted-foreground` on `muted` | 5.51:1 | 6.94:1 |
| `muted-foreground` on `background` | 6.15:1 | 8.49:1 |
| `primary-foreground` on `primary` | 5.81:1 | 8.14:1 |
| `primary` on `card` | 5.81:1 | 8.04:1 |
| `accent-foreground` on `accent` | 7.87:1 | 9.75:1 |
| `primary` on `accent` | 4.84:1 | 6.83:1 |
| `destructive-foreground` on `destructive` | 6.31:1 | 9.34:1 |
| `mint-foreground` on `mint` | 11.05:1 | 9.37:1 |
| `apricot-foreground` on `apricot` | 8.36:1 | 9.27:1 |
| `sage` on `card` | 6.50:1 | 10.22:1 |
| `gold` on `card` | 6.77:1 | 10.48:1 |
| `clay` on `card` | 6.31:1 | 9.50:1 |
| `input` on `card` | 3.33:1 | 3.93:1 |

Success, warning and error badge text was also checked on its 10% tint over the card. Primary text and muted text were checked on mint. Do not lower text opacity to create hierarchy. Disabled controls are visibly disabled; decorative borders and illustration details do not encode status. Labels, icons and counts accompany colour. These palette calculations are not a complete accessibility audit of every screen or third-party control.

## Typography

**Source Serif 4 + Inter**, loaded with `next/font/google` in `src/app/layout.tsx` (`display: "swap"`, Latin subset). `font-display` is the serif for headlines, always at regular weight with gentle negative tracking; never bold it. `font-sans` (Inter) is for body and UI at 400–500; action labels are 500. The hero runs from 52px to 92px at 0.95 line height. A second headline line or phrase can drop to `text-muted-foreground` for emphasis instead of colour. Tabular numerals align scores, salaries and counts. Press Start 2P stays exclusive to the opt-in arcade skin.

## Shape, depth and motion

- `--radius: 1.5rem` for cards; feature panels go to 1.75rem; nested surfaces around 1rem. Buttons are 12px rounded rectangles (`rounded-xl`), not pills. Tags and eyebrows are small soft pills. Keep main actions at 44px.
- Buttons: `default` is charcoal (`bg-foreground`); `brand` is cobalt (`bg-primary`) for the single most important action on a surface; `outline` and `ghost` for the rest.
- Depth is soft: `shadow-card` is a faint, wide blur; `shadow-float` is for hover and menus. No hard offset shadows. Sections alternate between `background` and the cool-grey `section-band`.
- The hero has a blurred cobalt/lavender glow behind a frosted mascot card.
- Hover lifts a card 3px with a larger, softer shadow; pressing a button scales it to 98%. `prefers-reduced-motion` and Calm mode disable decorative motion globally.

## Illustration and emoji

Use crisp CSS/SVG shapes: the eye, sparks, rounded stamps, bubbly map markers and simple line icons. No generated photography is needed. Mascot movement is small and friendly; it never covers a job title or critical guidance. Emoji may punctuate a streak, trophy or optional game, with a text label alongside. Decorative emoji should be hidden from assistive technology when adjacent text already supplies their meaning. No skulls, graves or combat language for a user's application outcome.

The static mark uses fixed colours (charcoal tile, white eye, cobalt iris) so it remains recognisable on every surface. SVG, Apple icon and social artwork share its geometry. OG and Twitter cards use ImageResponse's built-in sans to render without an extra runtime font-service dependency. Canvas artwork and confetti use matching fixed palette values; canvas has a separate dark theme.

## The map

Retain the existing OpenFreeMap Positron style, tile endpoints, glyph service and visible attribution; no paid provider or key. Base layers are repainted from the CSS map tokens: pale blue-grey water, near-white land, soft mint parks, white roads with grey casing, and deep slate equivalents in dark mode. A live system-theme change repaints the loaded map.

Cobalt clusters show summed job counts; mint place bubbles show local counts with a cobalt outline and a soft blurred shadow. Apricot marks the selected place, which is also named in the sidebar. Popups use the body font, rounded corners and a soft float shadow. The adjacent place list keeps every action available without the map.

## Voice examples

| Situation | Use |
| --- | --- |
| Hero | “Big plans. Clear next steps.” |
| Explain the product | “Find UK employers that can sponsor your work visa.” |
| Complete a quest | “Nice work. Keep going if you like, or come back tomorrow for three new picks.” |
| Empty results | “No strong matches right now. Try adding more skills or places to your profile.” |
| Application setback | “Take a breath. There are more paths ahead.” |
| Data caveat | “A licence isn't a promise. Check the job ad or ask the recruiter about sponsorship.” |
| Error | “Couldn't load the map. Try again.” |

Keep visa requirements and eligibility language factual. Never replace uncertainty with a celebratory badge, imply affiliation with the Home Office, or call a licensed employer a guaranteed visa offer.

## Implementation verification

- Contrast for every pair in the table above was computed from sRGB values; body-text pairs are at least 4.5:1 and `input` is at least 3:1 on cards in both themes.
- `npm test`, `npm run lint` and `npx tsc --noEmit` pass.
- Home, the jobs list and the jobs map were checked in a browser, in light and dark mode, on the local dev server.
