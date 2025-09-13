// tools/upgrade-placeholders.mjs  (Node 18+)
// Upgrades ONLY posts with image_credit: "Placeholder"
// Tries Unsplash, then Pexels with progressively broader queries, then keeps placeholder if nothing safe is found.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { glob } from "glob";
import "dotenv/config";

const UKEY = process.env.UNSPLASH_KEY || "";
// Accept BOTH names to avoid mismatch issues
const PKEY = process.env.PEXELS_KEY || process.env.PEXELS_API_KEY || "";

const SLEEP_MS = 900;           // gentle delay to avoid rate limits
const RETRIES = 2;              // small retry budget

// ---- helpers ----
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function slugFromFilename(fp) {
  const base = path.basename(fp, path.extname(fp));
  const parts = base.split("-");
  return parts.length >= 4 ? parts.slice(3).join("-") : base;
}
function yearFromFilename(fp) {
  const m = path.basename(fp).match(/^(\d{4})-/);
  return m ? m[1] : "misc";
}
function firstCategory(fm) {
  if (Array.isArray(fm.data.categories) && fm.data.categories.length) return String(fm.data.categories[0]).toLowerCase();
  if (fm.data.category) return String(fm.data.category).toLowerCase();
  return "politics";
}
function genericKeywordsFor(category) {
  if (category === "politics") return "ballot voting election parliament government legislature";
  if (category === "sports")   return "stadium match competition sports field arena";
  if (category === "health")   return "hospital healthcare public health clinic";
  if (category === "culture")  return "museum culture arts heritage theater";
  return category;
}
function buildQueries({ title, country, category }) {
  const gen = genericKeywordsFor(category);
  const q1 = [title, country, category].filter(Boolean).join(" ");
  const q2 = [country, category].filter(Boolean).join(" ");
  const q3 = [title, category].filter(Boolean).join(" ");
  const q4 = gen;
  return [q1, q2, q3, q4].filter(Boolean);
}
function shouldAvoidFaces(fm) {
  return !(fm.data.person || (Array.isArray(fm.data.tags) && fm.data.tags.some(t => /candidate|person|profile/i.test(String(t)))));
}
async function ensureDir(p) {
  await fs.promises.mkdir(path.dirname(p), { recursive: true });
}

// ---- providers ----
async function searchUnsplash(query, { noFaces } = {}) {
  if (!UKEY) return null;
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "24");
  url.searchParams.set("orientation", "landscape");
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${UKEY}` }});
  if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}`);
  const data = await res.json();
  if (!data.results?.length) return null;
  for (const r of data.results) {
    if (noFaces && r?.tags?.some(t => /portrait|person|people|man|woman|face/i.test((t.title||"") + ""))) continue;
    const src = r.urls?.raw || r.urls?.full || r.urls?.regular;
    if (!src) continue;
    return { url: `${src}&w=1600`, credit: `${r.user?.name || "Unsplash"} — Unsplash` };
  }
  return null;
}

async function searchPexels(query) {
  if (!PKEY) return null;
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", "24");
  url.searchParams.set("orientation", "landscape");
  const res = await fetch(url, { headers: { Authorization: PKEY }});
  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}`);
  const data = await res.json();
  if (!data.photos?.length) return null;
  const r = data.photos[0];
  const dl = r.src?.large2x || r.src?.large || r.src?.original;
  if (!dl) return null;
  return { url: dl, credit: `${r.photographer || "Pexels"} — Pexels` };
}

async function tryProviders(query, { noFaces }) {
  // Try Unsplash, then Pexels
  let hit = null, attempts = 0;
  while (attempts <= RETRIES && !hit) {
    attempts++;
    try { hit = await searchUnsplash(query, { noFaces }); } catch { hit = null; }
    if (hit) break;
    try { hit = await searchPexels(query); } catch { hit = null; }
    if (!hit) await sleep(SLEEP_MS);
  }
  return hit;
}

// ---- main ----
(async () => {
  console.log(`[upgrade-placeholders] Providers: Unsplash=${!!UKEY}, Pexels=${!!PKEY}`);
  if (!UKEY && !PKEY) {
    console.error("No providers available. Set UNSPLASH_KEY and/or PEXELS_KEY (or PEXELS_API_KEY).");
    process.exit(1);
  }

  const files = await glob("src/posts/**/*.md");
  let upgraded = 0, skipped = 0, stillPlaceholder = 0, errors = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const fm = matter(raw);

    // Only target posts that currently have a placeholder image
    if (!fm.data.image || fm.data.image_credit !== "Placeholder") { skipped++; continue; }

    const title = fm.data.title || slugFromFilename(file);
    const country = fm.data.country || "";
    const category = firstCategory(fm);
    const queries = buildQueries({ title, country, category });

    const y = yearFromFilename(file);
    const s = slugFromFilename(file);
    const destRel = path.join("assets", "images", y, `${s}.jpg`);
    const destAbs = path.join(process.cwd(), destRel);

    let hit = null;
    const baseAvoidFaces = shouldAvoidFaces(fm);

    // pass 1–3: progressively broader with face-avoid
    for (let i = 0; i < queries.length && !hit; i++) {
      const q = queries[i];
      console.log(`[search] ${file} :: q${i+1}="${q}" noFaces=${baseAvoidFaces}`);
      try {
        hit = await tryProviders(q, { noFaces: baseAvoidFaces });
      } catch {}
      await sleep(SLEEP_MS);
    }

    // final pass: category generic WITHOUT face-avoid (last resort)
    if (!hit) {
      const q = genericKeywordsFor(category);
      console.log(`[search-final] ${file} :: "${q}" noFaces=false`);
      try { hit = await tryProviders(q, { noFaces: false }); } catch {}
    }

    if (!hit) {
      console.log("[keep placeholder]", file);
      stillPlaceholder++;
      continue;
    }

    try {
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
      console.log("[UPGRADED]", file, "->", destRel);
      upgraded++;
    } catch (e) {
      console.warn("[ERR]", file, e.message);
      errors++;
    }
  }

  console.log(`\nUpgrade placeholders → upgraded ${upgraded}, skipped (not placeholder) ${skipped}, still placeholder ${stillPlaceholder}, errors ${errors}.`);
})();
