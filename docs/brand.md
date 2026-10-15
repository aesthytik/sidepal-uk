# Horus — your next chapter

## Concept and personality

**Big plans. Clear next steps.** Horus is an encouraging companion for a serious job search. The eye becomes a rounded violet badge with a mint iris and a small apricot spark: attentive, optimistic and recognisable at favicon size. Rounded typography, generous space, colourful progress and tactile cards make the search feel approachable. Official data, honest caveats and clear controls provide trust.

We are curious, capable and warm. Celebrate actions people can control: researching, saving, applying and preparing. Avoid promises about getting a visa, pressure about streaks, jokes about rejection or treating immigration problems as a punchline. Progress is encouragement, never a measure of someone's worth.

## Audit of the previous identity

- `_brand/mark.tsx`, `icon.svg`, Apple and shared OG/Twitter artwork used the forest-green eye and paper/Georgia social card. The mascot and canvas game repeated the old colours independently.
- `globals.css` and `tailwind.config.ts` defined a restrained paper/ink/green system with 8px corners and minimal depth. Layout loaded Fraunces and Inter. Motion was partially disabled, with some transitions and generic animation utilities still active in reduced-motion mode.
- `components/ui` provided compact buttons, rectangular badges/chips and functional sheets/drawers. The icon set is retained for familiar meaning. Sheets and drawers inherit the new tokens and larger corners; their behaviour is unchanged.
- Navigation used an underline and small mark; the home hero used a serif statement and isolated mascot. JobCard and CompanyCard were plain editorial frames; rarity had little visual distinction.
- DailyQuest, HUD, TrophyRoom, QuestBoard, global game feedback, SecretEye and StampRush shared the restrained styling. A few board labels treated interviews and rejection flippantly. Those labels now offer encouragement while the existing rewards, events and interactions remain intact.
- `jobs/JobMap.tsx` already used free OpenFreeMap tiles, CSS-driven recolouring, clusters, tooltips and a keyboard-accessible place list. Its paper/green basemap and small translucent circles needed a stronger identity and more readable counts.

## Colour tokens

These HSL channels are the source values in `src/app/globals.css`, consumed as `hsl(var(--token))` and exposed through Tailwind. The theme follows the operating system. `gold`, `clay` and `sage` retain their existing API names for reward/warning, error/setback and success. Mint and apricot are paired surfaces, not body-text colours. `border` is a decorative separator; use `input` for control boundaries and `ring` for focus.

```css
:root {
  --background: 247.5 100.0% 98.4%; /* #F8F7FF */
  --foreground: 249.6 28.1% 17.5%; /* #242039 */
  --card: 0.0 0.0% 100.0%; /* #FFFFFF */
  --card-foreground: 249.6 28.1% 17.5%; /* #242039 */
  --primary: 254.3 61.8% 50.8%; /* #5934CF */
  --primary-foreground: 0.0 0.0% 100.0%; /* #FFFFFF */
  --muted: 253.8 48.1% 94.7%; /* #EEEBF8 */
  --muted-foreground: 256.2 12.5% 40.8%; /* #625B75 */
  --accent: 256.8 100.0% 95.1%; /* #EDE6FF */
  --accent-foreground: 258.8 62.1% 38.2%; /* #4B259E */
  --destructive: 5.7 52.0% 40.0%; /* #9B3B31 */
  --destructive-foreground: 0.0 0.0% 100.0%; /* #FFFFFF */
  --border: 258.3 37.7% 88.0%; /* #DCD5EC */
  --input: 262.0 13.5% 56.5%; /* #8C819F */
  --ring: 254.3 61.8% 50.8%; /* #5934CF */
  --gold: 33.8 75.3% 28.6%; /* #805012 */
  --clay: 5.7 52.0% 40.0%; /* #9B3B31 */
  --sage: 157.6 49.6% 26.5%; /* #22654C */
  --mint: 148.7 67.6% 86.7%; /* #C6F4DC */
  --mint-foreground: 158.1 51.0% 20.0%; /* #194D3A */
  --apricot: 28.9 100.0% 84.5%; /* #FFD6B0 */
  --apricot-foreground: 26.8 60.3% 24.7%; /* #653B19 */
  --map-water: 253.8 79.6% 90.4%; /* #DCD3FA */
  --map-land: 252.0 100.0% 98.0%; /* #F7F5FF */
  --map-park: 150.0 36.1% 85.9%; /* #CEE8DB */
  --map-road: 0.0 0.0% 100.0%; /* #FFFFFF */
  --map-road-casing: 265.0 31.6% 77.6%; /* #C3B4D8 */
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: 252.0 30.6% 9.6%; /* #141120 */
    --foreground: 256.0 100.0% 97.1%; /* #F4F0FF */
    --card: 254.3 28.0% 14.7%; /* #201B30 */
    --card-foreground: 256.0 100.0% 97.1%; /* #F4F0FF */
    --primary: 257.6 100.0% 83.3%; /* #C3AAFF */
    --primary-foreground: 263.6 46.5% 13.9%; /* #201334 */
    --muted: 257.5 24.5% 19.2%; /* #2C253D */
    --muted-foreground: 260.0 25.0% 76.5%; /* #BEB4D2 */
    --accent: 262.0 35.0% 22.9%; /* #35264F */
    --accent-foreground: 260.0 100.0% 89.4%; /* #DBC9FF */
    --destructive: 10.0 100.0% 82.4%; /* #FFB4A5 */
    --destructive-foreground: 10.3 47.9% 14.3%; /* #361913 */
    --border: 259.3 17.9% 30.6%; /* #49405C */
    --input: 273.1 11.4% 50.0%; /* #81718E */
    --ring: 257.6 100.0% 83.3%; /* #C3AAFF */
    --gold: 38.4 84.7% 74.3%; /* #F5CD86 */
    --clay: 10.0 100.0% 82.4%; /* #FFB4A5 */
    --sage: 150.0 54.3% 72.5%; /* #93DFB9 */
    --mint: 162.0 35.7% 22.0%; /* #244C40 */
    --mint-foreground: 149.0 68.2% 82.7%; /* #B5F1D2 */
    --apricot: 25.7 43.4% 22.2%; /* #513520 */
    --apricot-foreground: 28.7 100.0% 86.5%; /* #FFDBBA */
    --map-water: 262.9 32.7% 20.4%; /* #302345 */
    --map-land: 249.5 24.7% 15.1%; /* #201D30 */
    --map-park: 162.6 29.0% 21.0%; /* #26453C */
    --map-road: 268.9 13.7% 38.6%; /* #625570 */
    --map-road-casing: 257.1 29.2% 9.4%; /* #15111F */
  }
}
```

Keep normal text at least 4.5:1 and meaningful control boundaries at least 3:1. Computed WCAG sRGB ratios for the core token pairs (rounded only for display):

| Text / surface | Light | Dark |
| --- | --- | --- |
| `foreground` on `background` | 14.72:1 | 16.59:1 |
| `card-foreground` on `card` | 15.66:1 | 14.87:1 |
| `muted-foreground` on `muted` | 5.46:1 | 7.40:1 |
| `primary-foreground` on `primary` | 7.45:1 | 8.73:1 |
| `accent-foreground` on `accent` | 8.44:1 | 8.96:1 |
| `destructive-foreground` on `destructive` | 6.85:1 | 9.44:1 |
| `mint-foreground` on `mint` | 8.03:1 | 7.55:1 |
| `apricot-foreground` on `apricot` | 7.07:1 | 8.56:1 |
| `sage` on `card` | 6.92:1 | 10.70:1 |
| `gold` on `card` | 6.83:1 | 11.07:1 |
| `clay` on `card` | 6.85:1 | 9.77:1 |

Success, warning and error badge text was also checked on its 10% tint over the card. Primary text and muted text were checked on mint. Do not lower text opacity to create hierarchy. Disabled controls are visibly disabled; decorative borders and illustration details do not encode status. Labels, icons and counts accompany colour. These palette calculations are not a complete accessibility audit of every screen or third-party control.

## Typography

**Space Grotesk + DM Sans**, loaded with `next/font/google` in `src/app/layout.tsx` using `display: "swap"` and the Latin subset. `--font-display` / `font-display` holds the expressive geometric headings; `--font-body` / `font-sans` holds the clear reading and UI face. System sans is the fallback. The existing Press Start 2P font stays exclusive to the opt-in arcade skin and is not preloaded.

Use display at 600–700, body at 400–500 and action labels at 600. Base body is 16px; detailed labels can be 12–14px. Hero is responsive from 44px to 72px, tight but readable at 1.04 line height. Long paragraphs keep relaxed line height and short line lengths. Tabular numerals align scores, salaries and counts. Avoid long all-caps text and decorative italics in new headlines.

## Shape, depth and motion

- `--radius: 1.25rem` for cards and panels; nested surfaces around 1rem. Buttons, filters, status badges and streak chips are pills. The eye badge has 22/64 rounded corners. Keep controls big enough to use comfortably (44px main actions, at least 36px compact controls).
- Cards use a 3px offset shadow; raised controls use `shadow-button`; menus use `shadow-float`. Borders keep the shape visible when shadows are hard to see. Avoid stacking many shadows on one element.
- Hero illustration uses a soft organic silhouette and two static, slightly tilted stickers. Gradients are decorative surfaces only. Keep all essential content in normal document flow.
- Hover can lift a card 2px in 180ms; pressing a button moves it down 2px. Quest rewards use brief reveals. Map bubbles grow on fresh results and show a single 550ms hover ring. No continuous hover flashing.
- `prefers-reduced-motion: reduce` and existing Calm mode disable decorative CSS animation and transitions globally. Existing JS mascot, map and confetti effects use `useCalm`; game rules and user controls stay unchanged. No new automatic sound. Progress remains legible with motion off.

## Illustration and emoji

Use crisp CSS/SVG shapes: the eye, sparks, rounded stamps, bubbly map markers and simple line icons. No generated photography is needed. Mascot movement is small and friendly; it never covers a job title or critical guidance. Emoji may punctuate a streak, trophy or optional game, with a text label alongside. Decorative emoji should be hidden from assistive technology when adjacent text already supplies their meaning. No skulls, graves or combat language for a user's application outcome.

The static mark uses fixed light colours so it remains recognisable on every surface. SVG, Apple icon and social artwork share its geometry. OG and Twitter cards use ImageResponse's built-in sans to render without an extra runtime font-service dependency. Canvas artwork and confetti use matching fixed palette values; canvas has a separate dark theme.

## The map

Retain the existing OpenFreeMap Positron style, tile endpoints, glyph service and visible attribution; no paid provider or key. Override base layer paints by role: lavender water, almost-white land, mint parks, white roads with lavender casing; plum water/land, deep green parks and muted lilac roads in dark mode. CSS map tokens drive both themes; a live system-theme change repaints the loaded map.

Violet clusters show summed job counts; mint place bubbles show local counts, with a violet outline and offset shadow. Apricot indicates the selected place, also named in the sidebar. Opaque fills, generous minimum radii and paired text colours keep numbers legible. Popups use the body font, rounded borders and a violet edge. The same place actions remain available in the adjacent list for keyboard and non-map use. The basemap's street labels retain its supplied Noto Sans glyphs. Paint overrides follow the [MapLibre layer specification](https://maplibre.org/maplibre-style-spec/layers/).

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

- `npm test`: 22 files / 232 tests passed.
- `npm run lint` and `npx tsc --noEmit`: passed.
- Tailwind compiled the complete application stylesheet successfully.
- The shared OG/Twitter card (1200×630) and Apple mark (180×180) were rendered with `next/og` and visually inspected. The social card deliberately uses no remote emoji assets.
- Core light/dark text pairs, tinted badges and control-boundary contrast were calculated from sRGB values. The table above records the core ratios.
- Live browser, responsive layout, downloaded Google Fonts and WebGL/tile interaction remain unverified: this sandbox rejects starting the Next.js server (`listen EPERM` on 127.0.0.1:3011). Review the home, jobs map, profile-backed daily quest and saved/trophy views in both OS themes, with reduced motion on, before release. No production build was attempted; it additionally needs remote fonts and Supabase access.
