# Strict Wikidata Image Filler (Upgrade A)

This tool tries to attach **accurate images** to posts by resolving the exact election entity on **Wikidata** first. If it can’t verify accuracy, it falls back to **category/country placeholders**.

## What it does
- Reads every Markdown file in `src/posts/`.
- Parses front matter (requires at least a `title` and `date`; better with `country`, `election_year`, `election_name`, and `categories`).
- Tries to find the **Wikidata QID** for the election (prefer `election_name`, otherwise `country + election_year + election`).
- Fetches the image (`P18`) from Wikidata or the page image from Wikipedia.
- Validates caption/title to include the country name and election/vote keywords.
- If validation fails, uses a placeholder based on `categories[0]` and optional `country` mapping.
- Writes the image locally to `assets/images/<year>/<slug>.jpg` and updates front matter with:
  - `image: "/assets/images/<year>/<slug>.jpg"`
  - `image_credit: "<source> — via Wikimedia"`

## Install
```bash
npm i -D gray-matter
```

(Uses Node 18+ for global `fetch`.)

## Run
```bash
node tools/fill-images-wikidata.mjs
```

## Optional: Placeholders
- Add your own placeholder JPEGs under `assets/placeholders/<category>/[<country>.jpg|default.jpg]`
- Edit `tools/placeholders.json` to map `category -> country -> file`

## Eleventy passthrough
Make sure `.eleventy.js` copies your images:
```js
eleventyConfig.addPassthroughCopy({ "assets/images": "assets/images" });
eleventyConfig.addPassthroughCopy({ "assets/placeholders": "assets/placeholders" });
```

## Notes
- This script is conservative; it **won’t overwrite** an existing `image:`.
- If a post lacks `categories`, it assumes `"politics"`.
- If a post lacks `country` or `election_year`, it will still attempt a best-effort search using the `title` + “election” keywords.
