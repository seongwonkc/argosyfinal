// add-images.js (Node 18+)
// deps: npm i -D gray-matter glob dotenv
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { glob } = require("glob");
require("dotenv").config();

const UNSPLASH_KEY = process.env.UNSPLASH_KEY;
if (!UNSPLASH_KEY) {
  console.error("Missing UNSPLASH_KEY in .env");
  process.exit(1);
}

async function ensureDir(p) {
  await fs.promises.mkdir(path.dirname(p), { recursive: true });
}

function slugFromFilename(fp) {
  const base = path.basename(fp, path.extname(fp));
  const parts = base.split("-");
  return parts.length >= 4 ? parts.slice(3).join("-") : base; // after YYYY-MM-DD-
}

function yearFromFilename(fp) {
  const m = path.basename(fp).match(/^(\d{4})-/);
  return m ? m[1] : "misc";
}

async function searchUnsplash(query) {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "20");
  url.searchParams.set("orientation", "landscape");
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  });
  if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}`);
  const data = await res.json();
  if (!data.results || !data.results.length) return null;

  // pick the first reasonable, non-portraity result
  for (const r of data.results) {
    const src = r.urls?.raw || r.urls?.full || r.urls?.regular;
    if (!src) continue;
    const credit = `${r.user?.name || "Unsplash"} — Unsplash`;
    return { url: `${src}&w=1600`, credit };
  }
  return null;
}

(async () => {
  const files = await glob("src/posts/**/*.md");
  let filled = 0, skipped = 0, missed = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const fm = matter(raw);
    if (fm.data.image) { skipped++; continue; }

    const title = fm.data.title || slugFromFilename(file);
    const country = (fm.data.country || "").trim();
    const category = (Array.isArray(fm.data.categories) ? fm.data.categories[0] : fm.data.category || "").trim();
    const query = [title, country, category].filter(Boolean).join(" ");

    try {
      const hit = await searchUnsplash(query || title);
      if (!hit) { missed++; continue; }

      const slug = slugFromFilename(file);
      const year = yearFromFilename(file);
      const destRel = path.join("assets", "images", year, `${slug}.jpg`);
      const destAbs = path.join(process.cwd(), destRel);

      const imgRes = await fetch(hit.url);
      if (!imgRes.ok) throw new Error(`download ${imgRes.status}`);
      await ensureDir(destAbs);
      await fs.promises.writeFile(destAbs, Buffer.from(await imgRes.arrayBuffer()));

      const updated = matter.stringify(fm.content, {
        ...fm.data,
        image: "/" + destRel.replace(/\\/g, "/"),
        image_credit: hit.credit,
      });
      fs.writeFileSync(file, updated, "utf8");
      console.log("[OK]", file, "->", destRel);
      filled++;
    } catch (e) {
      console.warn("[ERR]", file, e.message);
      missed++;
    }
  }

  console.log(`Done. Filled ${filled}, skipped ${skipped}, missed ${missed}.`);
})();
