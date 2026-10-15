# Horus: bright, friendly, clear

## Concept

**Find UK employers that can sponsor your visa.** Horus is a practical companion for a serious job search. The look is bright and plain-spoken: black type on white, a deep forest green for actions and big colour bands, and five cheerful colour families (green, pink, blue, amber, purple) for labels, cards and tools. The visual system follows the layout and motion patterns of parentsquare.com; Horus keeps its own name, eye mark, copy and photos.

We are curious, capable and warm. Celebrate actions people can control: researching, saving, applying and preparing. Avoid promises about getting a visa, pressure about streaks, jokes about rejection or treating immigration problems as a punchline.

## History

- 2026-10 (current): forest green and colour families, Onest + Inter, GSAP-pinned hero, light only.
- 2026-10: editorial serif look (Source Serif 4, charcoal and cobalt).
- 2026-10: violet "next chapter" identity (Space Grotesk, offset shadows).
- Earlier: forest-green paper/ink identity with Fraunces and Inter.

## Colour tokens

HSL channels in `src/app/globals.css`, used as `hsl(var(--token))` and exposed through Tailwind. Light only (`color-scheme: light`; Tailwind `darkMode` is `class` and nothing sets it).

- `primary` is forest `#224B17`, with light green `#9AEB83` text on it. Use it for main buttons, the dark bands and the footer.
- `accent` (`#E5FAE0`) is the pale green section background.
- Colour families: `--{green,pink,blue,amber,purple}-{dot,soft,ink}`, as Tailwind `bg-pink-dot`, `bg-pink-soft`, `text-pink-ink` and so on. `dot` is the bright square, card or icon chip (black text on it); `soft` is a pastel label background with `ink` text.
- `apricot`/`mint`/`gold`/`clay`/`sage` keep their API names for the game layer and status colours, now mapped into the families.

```css
:root {
  --background: 0.0 0.0% 100.0%; /* #FFFFFF */
  --foreground: 0.0 0.0% 0.0%; /* #000000 */
  --card: 0.0 0.0% 100.0%; /* #FFFFFF */
  --card-foreground: 0.0 0.0% 0.0%; /* #000000 */
  --primary: 107.3 53.1% 19.2%; /* #224B17 */
  --primary-foreground: 106.7 72.2% 71.8%; /* #9AEB83 */
  --muted: 0.0 0.0% 94.5%; /* #F1F1F1 */
  --muted-foreground: 0.0 0.0% 30.2%; /* #4D4D4D */
  --accent: 108.5 72.2% 92.9%; /* #E5FAE0 */
  --accent-foreground: 107.3 53.1% 19.2%; /* #224B17 */
  --destructive: 0.0 100.0% 37.6%; /* #C00000 */
  --destructive-foreground: 0.0 0.0% 100.0%; /* #FFFFFF */
  --border: 0.0 0.0% 89.0%; /* #E3E3E3 */
  --input: 0.0 0.0% 54.1%; /* #8A8A8A */
  --ring: 107.3 53.1% 19.2%; /* #224B17 */
  --gold: 38.5 76.8% 27.1%; /* #7A5410 */
  --clay: 0.0 100.0% 37.6%; /* #C00000 */
  --sage: 108.5 62.7% 29.4%; /* #2E7A1C */
  --mint: 108.5 72.2% 92.9%; /* #E5FAE0 */
  --mint-foreground: 107.3 53.1% 19.2%; /* #224B17 */
  --apricot: 40.0 100.0% 92.9%; /* #FFF3DB */
  --apricot-foreground: 39.7 71.7% 19.4%; /* #553D0E */
  --green-dot: 106.9 72.9% 58.0%; /* #68E246 */
  --green-soft: 108.5 72.2% 92.9%; /* #E5FAE0 */
  --green-ink: 107.3 53.1% 19.2%; /* #224B17 */
  --pink-dot: 308.4 96.5% 66.5%; /* #FC57E5 */
  --pink-soft: 308.9 93.1% 94.3%; /* #FEE3FA */
  --pink-ink: 308.7 48.7% 22.2%; /* #541D4C */
  --blue-dot: 203.1 100.0% 53.1%; /* #10A3FF */
  --blue-soft: 204.0 100.0% 92.2%; /* #D7EFFF */
  --blue-ink: 203.2 88.9% 17.6%; /* #053655 */
  --amber-dot: 40.0 100.0% 58.2%; /* #FFB82A */
  --amber-soft: 40.0 100.0% 92.9%; /* #FFF3DB */
  --amber-ink: 39.7 71.7% 19.4%; /* #553D0E */
  --purple-dot: 271.3 100.0% 73.3%; /* #BE77FF */
  --purple-soft: 270.0 100.0% 95.3%; /* #F3E7FF */
  --purple-ink: 270.6 38.2% 24.1%; /* #3E2655 */
  --forest-deep: 108.6 52.9% 27.5%; /* #2F6B21 */
  --lime: 106.9 72.2% 78.8%; /* #B3F0A2 */
  --map-water: 204.0 100.0% 92.2%; /* #D7EFFF */
  --map-land: 0.0 0.0% 98.0%; /* #FAFAFA */
  --map-park: 108.5 72.2% 92.9%; /* #E5FAE0 */
  --map-road: 0.0 0.0% 100.0%; /* #FFFFFF */
  --map-road-casing: 0.0 0.0% 85.5%; /* #DADADA */
  --radius: 15px;
  --shadow-card: none;
  --shadow-float: 0 8px 24px -10px hsl(0 0% 0% / 0.18);
}
```

Contrast (WCAG sRGB):

| Text / surface | Ratio |
| --- | --- |
| `foreground` on `background` | 21.00:1 |
| `muted-foreground` on `muted` | 7.48:1 |
| `muted-foreground` on `background` | 8.45:1 |
| `primary-foreground` on `primary` | 6.99:1 |
| `primary` on `background` | 10.06:1 |
| `accent-foreground` on `accent` | 9.14:1 |
| `destructive-foreground` on `destructive` | 6.48:1 |
| `sage` on `card` | 5.36:1 |
| `gold` on `card` | 6.77:1 |
| `clay` on `card` | 6.48:1 |
| `input` on `card` | 3.45:1 |
| `lime` on `primary` | 7.62:1 |
| `background` on `primary` | 10.06:1 |
| `primary` on `green-dot` | 6.02:1 |
| `foreground` on `green-dot` | 12.56:1 |
| `foreground` on `pink-dot` | 7.63:1 |
| `foreground` on `blue-dot` | 7.70:1 |
| `foreground` on `amber-dot` | 12.14:1 |
| `foreground` on `purple-dot` | 7.27:1 |
| `green-ink` on `green-soft` | 9.14:1 |
| `pink-ink` on `pink-soft` | 10.61:1 |
| `blue-ink` on `blue-soft` | 10.62:1 |
| `amber-ink` on `amber-soft` | 9.27:1 |
| `purple-ink` on `purple-soft` | 10.96:1 |

## Typography

**Onest 500** for `font-display` (headings, buttons, nav), a free stand-in for Atyp BL; **Inter** for body and UI. Headings use weight 500 with −0.02em tracking. Hero h1 is 52px on a 1.15 line; section h2 is 52px; the pinned statement and smaller h2s are 40px; h3 is 20–26px. Section labels (`.eyebrow`) are a coloured square (`--dot`) plus 13px uppercase text. Press Start 2P stays exclusive to the arcade easter egg.

## Shape and components

- `--radius: 15px`. Buttons have 11px corners: `default` is forest with light-green text, `outline` has a 0.625px forest border, `lg` is the 51px homepage size. `ArrowChip` adds the small arrow square to main calls to action.
- No card shadows; cards use a thin border. Floating labels (`.float-label`) and checklist cards get a soft shadow.
- Feature blocks: big bright-colour frame (`bg-green-dot`, `bg-pink-dot`) holding a white UI card, with a floating checklist or label.
- Forest bands hold carousels (`Carousel` in `src/components/motion.tsx`: snap track, white square arrows, optional "01 / 03" counter).
- `Tabs` (big grey/black text tabs with a tilted photo) and `Accordion` (white rows with colour icon chips; the open row turns forest) are keyboard-accessible.
- Footer: forest, light-green uppercase headings, white links, giant cropped "Horus" wordmark in `forest-deep`.

## Motion

- `HeroScroll` (`src/components/HeroScroll.tsx`, GSAP + ScrollTrigger): on screens 1024px wide and 640px tall or more, the hero pins under the nav. The intro and floating labels blur out (opacity 0, blur 15px, scale 0.85), the photo shrinks away, and the statement and pain-point cards blur in. Scroll scrubs it both ways.
- `Reveal`: fade up from 30px over 0.8s when entering the viewport, with `delay` for staggering.
- `Marquee`: continuous sideways scroll of place names.
- Reduced motion and Calm mode turn off pinning, blurs and reveals. Content is only hidden once JS has run (`html.js`).

## Photos

Free Unsplash License photos in `public/images/` (WebP, 150KB or less each), listed with sources in `public/images/CREDITS.md`. Always use `next/image` with meaningful alt text, or `alt=""` when decorative.

## Logo

The eye badge keeps its geometry: forest tile, white eye, bright green iris and spark. `icon.svg`, `_brand/mark.tsx`, the Apple icon and the mascot share these values.

## The map

OpenFreeMap tiles repainted from tokens: blue water (`--map-water`), near-white land, pale green parks, white roads. Clusters are forest with light-green counts; place bubbles are lime with forest outlines; the selected place is amber.

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

- Contrast table above computed from the token values.
- `npm test`, `npm run lint` and `npx tsc --noEmit` pass.
- Home page compared section by section with parentsquare.com in a browser at 1512px, plus a 375px phone check. `/jobs` (list and map), `/sponsors`, `/visa-salary-checker` and `/profile` were checked visually.
