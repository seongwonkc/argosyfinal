import fs from "fs";
import path from "path";
import matter from "gray-matter";
import dotenv from "dotenv";
dotenv.config();

const POSTS_DIR = "src/posts";
const PLACEHOLDERS = JSON.parse(fs.readFileSync("tools/placeholders.json", "utf8"));

const UKEY = process.env.UNSPLASH_ACCESS_KEY;
const PKEY = process.env.PEXELS_API_KEY;

function slugFromFilename(fname) {
  const base = path.basename(fname, path.extname(fname));
  const parts = base.split("-");
  if (parts.length >= 4) return parts.slice(3).join("-");
  return base;
}
function yearFromFilename(fname) {
  const m = path.basename(fname).match(/^(\d{4})-/);
  return m ? m[1] : "misc";
}
function listMarkdownFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith(".md")).map(f => path.join(dir, f));
}
function updateFrontMatterString(src, updater) {
  const parsed = matter(src);
  const updated = updater(parsed);
  return matter.stringify(updated.content, updated.data);
}
async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("download failed " + res.status);
  await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
  const file = fs.createWriteStream(destPath);
  await new Promise((resolve, reject) => {
    res.body.pipe(file);
    res.body.on("error", reject);
    file.on("finish", resolve);
  });
}
function pickPlaceholder(category = "politics", country) {
  const catMap = PLACEHOLDERS[category] || PLACEHOLDERS["default"];
  return (country && catMap[country.toLowerCase()]) || catMap["default"] || PLACEHOLDERS.default.default;
}
function buildQuery({ country, category, title }) {
  const pieces = [];
  if (country) pieces.push(country);
  if (category) pieces.push(category);
  // steer toward elections-like terms for politics; and neutral terms for other categories
  if (category === "politics") pieces.push("ballot voting election parliament government");
  else if (category === "sports") pieces.push("stadium match competition");
  else if (category === "health") pieces.push("hospital healthcare public health");
  else if (category === "culture") pieces.push("museum culture arts heritage");
  return pieces.join(" ").trim();
}
function shouldAvoidFaces(fm) {
  // If article specifies a person explicitly, allow faces; else avoid.
  return !(fm.data.person || (Array.isArray(fm.data.tags) && fm.data.tags.some(t => /candidate|person|profile/i.test(t))));
}

// Unsplash search
async function searchUnsplash(params) {
  if (!UKEY) return null;
  const q = encodeURIComponent(params.query);
  const url = `https://api.unsplash.com/search/photos?query=${q}&per_page=20&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: `Client-ID ${UKEY}` }});
  if (!res.ok) throw new Error("Unsplash HTTP " + res.status);
  const data = await res.json();
  if (!data.results || !data.results.length) return null;
  const avoidFaces = params.avoidFaces;
  for (const r of data.results) {
    // filter by location/country if provided
    if (params.country) {
      const loc = (r.location && (r.location.country || r.location.name)) || "";
      if (loc && !loc.toLowerCase().includes(params.country.toLowerCase())) continue;
    }
    if (avoidFaces && (r?.tags?.some(t=>/portrait|person|people|man|woman|face/i.test(t.title || "")))) continue;
    const dl = r.urls?.raw || r.urls?.full || r.urls?.regular;
    if (!dl) continue;
    const credit = `${r.user?.name || "Unsplash"} — Unsplash`;
    return { url: dl + "&w=1600", credit };
  }
  return null;
}

// Pexels search
async function searchPexels(params) {
  if (!PKEY) return null;
  const q = encodeURIComponent(params.query);
  const url = `https://api.pexels.com/v1/search?query=${q}&per_page=20&orientation=landscape`;
  const res = await fetch(url, { headers: { Authorization: PKEY }});
  if (!res.ok) throw new Error("Pexels HTTP " + res.status);
  const data = await res.json();
  if (!data.photos || !data.photos.length) return null;
  for (const r of data.photos) {
    const dl = r.src?.large2x || r.src?.large || r.src?.original;
    if (!dl) continue;
    const credit = `${r.photographer || "Pexels"} — Pexels`;
    return { url: dl, credit };
  }
  return null;
}

async function main() {
  const files = listMarkdownFiles(POSTS_DIR);
  let filled = 0, skipped = 0, placeholders = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const fm = matter(raw);
    if (fm.data.image) { skipped++; continue; }

    const category = (Array.isArray(fm.data.categories) ? fm.data.categories[0] : fm.data.category || "").toLowerCase() || "politics";
    const country = fm.data.country || "";
    const slug = slugFromFilename(file);
    const year = (fm.data.date ? String(fm.data.date).slice(0,4) : "misc");
    const destRel = path.join("assets", "images", year, `${slug}.jpg`);
    const destAbs = path.join(process.cwd(), destRel);

    const params = {
      query: buildQuery({ country, category, title: fm.data.title || "" }),
      avoidFaces: shouldAvoidFaces(fm),
      country, category
    };

    let hit = null;
    try { hit = await searchUnsplash(params); } catch {}
    if (!hit) { try { hit = await searchPexels(params); } catch {} }

    if (!hit) {
      const ph = pickPlaceholder(category, country);
      const updated = updateFrontMatterString(raw, (parsed) => {
        parsed.data.image = ph;
        parsed.data.image_credit = "Placeholder";
        return parsed;
      });
      fs.writeFileSync(file, updated, "utf8");
      console.log("[PH]", file, "->", ph);
      placeholders++;
      continue;
    }

    await downloadFile(hit.url, destAbs);
    const updated = updateFrontMatterString(raw, (parsed) => {
      parsed.data.image = "/" + destRel.replace(/\\/g, "/");
      parsed.data.image_credit = hit.credit;
      return parsed;
    });
    fs.writeFileSync(file, updated, "utf8");
    console.log("[OK]", file, "->", destRel);
    filled++;
  }

  console.log(`Done. Filled ${filled}, skipped ${skipped}, placeholders ${placeholders}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
