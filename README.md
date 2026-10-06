# Cafe Tamarind website

Astro 5 + Tailwind 4, static output. Section flow and motion follow the High Dive build; colour, type, shape and voice follow `/design-system`.

```bash
npm install
npm run dev      # http://localhost:4323
npm run build    # static site in dist/
```

## Pages

- `/` landing page
- `/menu` all 225 dishes, grouped by when they are available
- `/privacy-policy`, `/404`

## Where things live

- `src/data/fullMenu.ts` every dish and price, transcribed from `/Menu.md`. Change a price here and it changes on both pages and in the order sheet.
- `src/data/site.ts` every other fact and string: phone, hours, copy, photo list. Lines tagged `CONFIRM` need the owner's yes.
- `src/styles/global.css` design tokens (Pit and Paper themes) from `/design-system/tokens.json`.
- `src/scripts/main.ts` carousel, live open / smoker / brisket status, order request.
- `photo-sources/` original photos, crop script and credits.

## Before it goes live

1. Replace the guest photos (see `photo-sources/CREDITS.md`).
2. Confirm the 2025 prices, then set those groups' `asOf` to the new date in `fullMenu.ts` (anything not `Sep 2026` shows a `*`).
3. Confirm: WhatsApp on 97476 38246, UPI only, brisket holds by phone, smoker start time (6 PM used).
4. Get permission for the review excerpts, or swap them.
5. Set `site` in `astro.config.mjs` to the real domain, then add a canonical tag, an absolute `og:image` URL and a sitemap.
6. Set `PROTOTYPE = false` in `src/data/site.ts` to drop the footer note.
