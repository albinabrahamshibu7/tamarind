# Photo sources

Every photograph on the site is a **guest photo from the Cafe Tamarind Google Maps listing**, downloaded on 6 Oct 2026 at 1600 px. They are placeholders for the pitch build. Before the site goes live, replace them with the cafe's own photography (the seven brand-book shots in `/brand-book/photography-prompts.md`, or a shoot), or get each uploader's permission.

Listing: https://www.google.com/maps/place/Tamarind+Cafe/@9.7647296,76.7011032,17z

`sources.txt` holds the original image path for each id. `process.py` crops them into `public/photos/`.

| Id | Uploaded | Shows | Used as |
|---|---|---|---|
| F3 | May 2026 | Brisket slices with sides on a steel tray | `tray-brisket`, `g-brisket-tray`, `og.jpg` |
| F10 | May 2026 | Ribs, smoked chicken, pulled meat, two burgers | `tray-mixed-platter`, `g-mixed-platter` |
| F22 | Aug 2026 | Beef platter with toasted bread and fries | `tray-beef-platter` |
| F5 | Aug 2026 | Burger and fries on butcher paper | `tray-burger`, `g-burger` |
| F26 | Dec 2025 | Creamy al-faham with kuboos, yard behind | `tray-alfaham` |
| F30 | Jul 2025 | Fried chicken momos | `tray-momos` |
| F44 | May 2026 | Pulled beef tray | `pulled-beef-tray` |
| F43 | Jul 2025 | Blue mojito and lime drink | `g-mojitos` |
| F53 | Dec 2025 | Smoked chicken under melted cheese | `g-cheese-chicken` |
| F41 | Jul 2025 | Al-faham on Arabic rice | `g-alfaham-rice` |
| V20 | Sep 2026 | Yard and pergola at dusk | `place-pergola-dusk` |
| V21 | Feb 2022 | Indoor room, pine benches | `place-room` |
| V5 | Oct 2025 | Yard at night, Texas BBQ counter | `place-yard-night` |
| V9 | Jan 2026 | Guests under the tree at night | `g-yard-tree` |
| V31 | May 2023 | Pergola in daylight | `g-pergola-day` |
| V18 | Feb 2021 | Indoor room by the grid windows | `g-room-windows` |

Downloaded but not used: F12, F16, F36, F38, F48, F50, V23, V34. `tray-burger`, `tray-alfaham` and `tray-momos` are exported but no longer placed.

## Hero plates (placeholders)

The five round plate cutouts in `public/hero/` are **the High Dive project's plates**, copied over on 6 Oct 2026 to keep the spinning-plate hero while Cafe Tamarind's own dishes are pending. They are not Cafe Tamarind's food.

| File | Shown as | Where |
|---|---|---|
| `alfaham-biriyani` | Al-faham with Arabic rice | hero slide 1 |
| `momos` | Chicken momos | hero slide 2, "Here at lunch?" |
| `alfaham-plate` | Al-faham | hero slide 3, "Here at lunch?" |
| `chicken-noodles` | Chicken noodles | hero slide 4 |
| `dum-biriyani` | Rice combos | hero slide 5. Loosest match: Cafe Tamarind has no biriyani on any menu sheet |

To swap one: add `<name>-1000.webp` and `<name>-560.webp` (transparent background, plate centred, top-down) to `public/hero/` and edit `heroSlides` in `src/data/site.ts`. Each slide also sets `accent`, the headline colour while it is up.

None of the five is a smoked dish, so the hero currently shows no brisket, ribs or platter.

Notes
- `g-yard-tree` shows guests at a distance. Swap it if anyone objects.
- No photo exists yet for pork ribs or pork belly on their own. P3 in the brand-book shot list covers ribs.
