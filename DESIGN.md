# Design

Visual system for The Argosy — "ship's ink and signal flags." A classical broadsheet with a maritime spine.

## Theme

Single light theme, committed (`color-scheme: light`). Ink-navy bookends (folio bar + footer) frame a white reading surface.

## Color

Strategy: **Full palette** — an ink/paper base, one signal accent, and a per-section flag system (a classic broadsheet move: section colors that aid navigation).

| Token | Value | Use |
|---|---|---|
| `--ink` | `#1d2733` | Text, heavy rules, folio/footer bg (sampled from the ship seal) |
| `--ink-2` | `#39424e` | Secondary text, deks |
| `--muted` | `#57606d` | Metadata, datelines (4.9:1 on white) |
| `--paper` | `#ffffff` | Body background |
| `--wash` | `#f3f5f7` | Panels, wells, image placeholders (navy-tinted, not cream) |
| `--rule` | `#d8dde3` | Hairline rules |
| `--accent` | `#9e2a24` | Links in prose, apply button, live markers (signal red) |

Section flags (kicker text, section-head underlines, category pages; all ≥4.5:1 on white):
politics `#8c2f2a` · culture `#7b3b72` · economics-and-finance `#8a5a13` · sustainability `#33682e` · health-and-medicine `#14656a` · psychology `#99395f` · sports `#2c4f8c` · roundtable `#414b59` · media `#6d581e` · communications `#46536b` · debate `#96471a` · interdisciplinary `#57613a`

## Typography

- Body: **EB Garamond** (400/500/600 + italics), `clamp(17px → 19px)`, line-height 1.62, measure 66ch, `text-wrap: pretty`.
- Display: **Newsreader** (variable, optical sizes) for nameplate, heds, section names. Register-legitimate: this is a literal newspaper.
- Scale (≥1.25 modular): meta .82rem · body 1rem · dek 1.16rem · h3 1.28rem · h2 1.62rem · article hed clamp(2rem–3.1rem) · nameplate clamp(2.75rem–4.5rem).
- Small caps (real `font-variant`) for bylines, datelines, kickers, section nav.
- Drop cap on article first paragraph (Newsreader 500, ink).

## Components

- **Folio bar**: thin ink-navy strip; date + motto left, utility links right (paper text).
- **Nameplate**: centered seal (engraved ship roundel, ~64px) above "The Argosy" in Newsreader 700, flanked by the motto in small caps; double "scotch" rule below.
- **Section nav**: sticky hairline bar; small-caps links with 3px flag-colored underline on hover/current; horizontally scrollable on mobile; "More" → /categories/.
- **Lead package** (home): image 3:2 left, kicker + hed + dek + byline right; "The Latest" list beneath the fold line.
- **Section block** (home): flag-named header + hairline; one featured item (thumb left) + compact headline list. No uniform card grids.
- **Byline row**: 28px pixel avatar (square, 4px radius, `image-rendering: pixelated`) + small-caps name + dateline + reading time. Roundtables use the ship seal as the avatar.
- **Article page**: kicker → hed → dek (from `excerpt`) → byline row → hero figure with `image_credit` caption → drop-cap body → "Filed under" → related-by-flag → prev/next.
- **Team cards**: 96px pixel avatars; alumni cards add a college pill.
- **Footer**: ink-navy; nameplate + motto, section index, pages/contact; colophon line.

## Motion

Editorial restraint: color/underline transitions (120–180ms ease-out), image hover scale 1.02 inside overflow-hidden figures, sticky-nav only. No entrance choreography. All transforms disabled under `prefers-reduced-motion`.

## Assets

- `assets/images/seal.png` — engraved ship roundel (masthead + roundtable avatar), resized from the 2048px original.
- `assets/images/avatars/*.png` — 12 pixel-art staff portraits, 128×128, shared cream backdrop.
- `assets/fallback.svg` — seal-on-wash 16:9 placeholder for imageless posts.
