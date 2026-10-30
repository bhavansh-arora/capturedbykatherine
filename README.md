# Captured by Katherine: website

A multi-page website for **Captured by Katherine**, Katherine Christensen's wedding, family and formal photography studio in Brisbane. Designed and built by [Code Bunny](https://codebunny.net).

The site is plain static HTML, CSS and JavaScript with no framework or server. Deploy the repository root to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Home: slideshow hero, scroll-lit intro, bento overview, pinned "real couples" reel, planner feature, stacking "how it works" steps, reviews |
| `weddings.html` | Approach, what's included, lightbox gallery, booking process timeline, collections |
| `family.html` | Sessions, **golden-hour finder**, gallery, styling guide, FAQ |
| `formals.html` | Sessions, **group cost splitter**, gallery, FAQ |
| `investment.html` | All pricing (in AUD) and the **collection finder** |
| `planner.html` | **Wedding-day timeline planner**, timed to Brisbane sunset, with coverage and package recommendation |
| `portfolio.html` | Filterable gallery (`?f=weddings`, `?f=family`, `?f=formals`) with lightbox |
| `about.html` | Katherine's story |
| `reviews.html` | Every review, with a featured testimonial |
| `enquire.html` | **Smart five-step enquiry** with live date check, conditional questions and an instant estimate |
| `404.html` | Not-found page |

## Editing prices, dates and settings

Everything lives in **`assets/js/data.js`**:

- `weddings` / `lifestyle`: package names, hours and prices (AUD). The finder, planner, cost splitter and enquiry estimate all read from here.
- `bookedDates`: add taken dates as `'2027-03-20'`. The date checkers then show them as booked.
- `extraHourRate`, `maxExtraHours`, `deposit`, `currency`.
- `formEndpoint`: paste a Formspree, Basin or similar JSON endpoint to receive enquiries directly. If it's left empty, the enquiry opens a pre-written email to Katherine with every detail filled in.

Prices also appear as text in the page markup for search engines. If a price changes, update both `data.js` and the page copy in `_build/src/pages/`.

## Editing page content

Page sources live in `_build/src/`:

- `layout.html`: shared `<head>` and scripts
- `partials/`: header, footer and the pre-footer call to action
- `pages/`: one file per page

Rebuild after editing (Node 18+, no dependencies):

```bash
node _build/build.mjs
```

The build wraps each page in the layout and expands `<x-img name="..." alt="..." sizes="...">` into responsive WebP `<img>` tags with width and height set, so images never cause layout shift.

## Images

`assets/img/` holds each photo in WebP at 900px (`-sm`), 1600px (`-lg`) and, for hero images, 2400px (`-xl`) on the long edge. All photography © Captured by Katherine.

## Tech notes

- Motion: GSAP 3.12 + ScrollTrigger, and Lenis smooth scrolling on desktop (all vendored in `assets/vendor/`).
- Respects `prefers-reduced-motion`, and every section is fully readable with JavaScript off.
- Responsive from 360px phones to large desktops. A sticky "Check your date" bar appears on phones.
- Sunrise and sunset come from the NOAA sunrise equation for Brisbane (AEST, no daylight saving).
