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

Layout grammar (2026-10 redesign): a broadsheet front page in the NYT manner. Ruled columns, not cards: stories sit in a grid separated by 1px `--rule` hairlines, and each section opens on a 1px ink rule with its name in the section flag.

- **Folio bar**: thin ink-navy strip; the date (inner pages) left; About · The Team · Join Us and an outlined **Newsletter** button right.
- **Masthead (front page)**: three zones. Left ear: long-form date + "Filed from five time zones / Est. 2023". Center: seal and "The Argosy" (Newsreader 700) on one line. Right ear: a promo (the free Argosy Workbook while NIE is live, else Join). Motto in small caps beneath. Ears drop below 760px.
- **Masthead (inner pages)**: compact centered seal + wordmark.
- **Section nav**: sticky; desks in roman, then a hairline divider and the paper's other work in italic (The Roundtable, Worksheets, More). 3px flag underline on hover/current; 3px double ink rule beneath. Scrolls horizontally on mobile.
- **Front page**: (1) top stories, 3fr, beside a Columnists rail, 1fr, split by a vertical hairline. Lead package = text left (desk label, hed, summary, byline with avatar), 3:2 picture right with credit; then three second-tier stories in ruled columns; then four text-only briefs. (2) Columnists rail: each current staff writer's newest piece not already on the page, with a 52px pixel avatar, name and role in small caps, headline in Newsreader italic; "From the Editor" note below. (3) "Beyond the news" band on `--wash` under a double ink rule: The Roundtable (participant avatar row), Newspaper in Education (a stack of worksheet sheets linking to the workbook), the Newsletter (inline Netlify form), Join the Crew; four ruled columns on desktop, two on tablet, stacked on phones. (4) Desk fronts: a lead story (16:9 picture, hed, summary) beside a stacked list of three stories, each with a summary and a small thumbnail on the right, the two halves ending at about the same height; alternate desks flip which side the lead sits on. (5) From the Archive: this calendar month in earlier years, one per year first.
- **Desk label**: small caps, flag color, above a headline only where stories from several desks share a row.
- **Byline**: small-caps name + dateline in muted display type; optional 32px pixel avatar.
- **Section front**: flag-colored section name with the desk's writers as an avatar row; lead package (2fr) beside two stacked stories (1fr); then a "Latest" river: dateline column, headline + summary + byline, thumbnail right.
- **Article page**: left-aligned header in the reading column (desk link → hed → dek → hairline → byline row), hero figure wider than the column with a left-aligned credit, drop-cap body, then an author box (avatar + "X is The Argosy's [role]"), "Filed under" and a newsletter link, related-by-flag, prev/next.
- **Team cards**: 96px pixel avatars; alumni cards add a college pill.
- **Footer**: newsletter band (email form) above the ink-navy footer: nameplate + motto, section index, pages/contact; colophon line.

## Motion

Editorial restraint: color/underline transitions (120–180ms ease-out), image hover scale 1.02 inside overflow-hidden figures, sticky-nav only. No entrance choreography. All transforms disabled under `prefers-reduced-motion`.

## Assets

- `assets/images/seal.png` — engraved ship roundel (masthead + roundtable avatar), resized from the 2048px original.
- `assets/images/avatars/*.png` — 12 pixel-art staff portraits, 128×128, shared cream backdrop.
- `assets/fallback.svg` — seal-on-wash 16:9 placeholder for imageless posts.
