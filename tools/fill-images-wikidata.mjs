// tools/fill-images-wikidata.mjs
// Strict Wikimedia/Wikidata filler for posts that LACK `image:`
// Node 18+ (has global fetch). Only touches posts without image.

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { glob } from "glob";

const PLACEHOLDERS = JSON.parse(
  fs.existsSync("tools/placeholders.json")
    ? fs.readFileSync("tools/placeholders.json", "utf8")
    : JSON.stringify({ default: { default: "/assets/placeholders/politics/default.jpg" } })
);

// ---------- helpers ----------
function slugFromFilename(fp) {
  const base = path.basename(fp, path.extname(fp));
  const parts = base.split("-");
  return parts.length >= 4 ? parts.slice(3).join("-") : base; // after YYYY-MM-DD-
}
function yearFromFilename(fp) {
  const m = path.basename(fp).match(/^(\d{4})-/);
  return m ? m[1] : "misc";
}
function pickPlaceholder(category = "politics", country) {
  const catMap = PLACEHOLDERS[category] || PLACEHOLDERS["default"] || { default: "/assets/placeholders/politics/default.jpg" };
  return (country && catMap[country.toLowerCase()]) || catMap["default"] || PLACEHOLDERS.default?.default;
}
function firstCategory(fm) {
  if (Array.isArray(fm.data.categories) && fm.data.categories.length) return String(fm.data.categories[0]).toLowerCase();
  if (fm.data.category) return String(fm.data.category).toLowerCase();
  return "politics";
}
async function ensureDir(p) {
  await fs.promises.mkdir(path.dirname(p), { recursive: true });
}

// ---------- Wikidata lookups ----------
async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "ArgosyImageFiller/2.0" } });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return await res.json();
}

// Find exact QID for an election (prefer `election_name`, else fall back to country+year+election, else title)
async function findElectionQID({ election_name, country, year, title }) {
  const query =
    election_name ||
    [country, year, "election"].filter(Boolean).join(" ") ||
    title;

  if (!query) return null;

  const api = new URL("https://www.wikidata.org/w/api.php");
  api.searchParams.set("action", "wbsearchentities");
  api.searchParams.set("format", "json");
  api.searchParams.set("language", "en");
  api.searchParams.set("uselang", "en");
  api.searchParams.set("type", "item");
  api.searchParams.set("search", query);
  api.searchParams.set("limit", "1");
  api.searchParams.set("origin", "*");

  const data = await fetchJson(api.toString());
  if (!data.search?.length) return null;
  const item = data.search[0];
  const text = ((item.label || "") + " " + (item.description || "")).toLowerCase();
  if (!/election|general election|presidential|parliament|legislative|local election|referendum/.test(text)) return null;
  return item.id; // QID like "Q12345"
}

// Get image for QID: try P18 from Commons, else enwiki pageimage
async function getImageForQID(qid) {
  // Entity data
  const ent = await fetchJson(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`);
  const entity = ent.entities?.[qid];
  if (!entity) return null;

  // P18 file name
  const p18 = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  if (p18) {
    const ii = new URL("https://commons.wikimedia.org/w/api.php");
    ii.searchParams.set("action", "query");
    ii.searchParams.set("format", "json");
    ii.searchParams.set("prop", "imageinfo");
    ii.searchParams.set("titles", "File:" + p18);
    ii.searchParams.set("iiprop", "url|extmetadata");
    ii.searchParams.set("iiurlwidth", "1600");
    ii.searchParams.set("origin", "*");
    const iiData = await fetchJson(ii.toString());
    const pages = iiData.query?.pages;
    if (pages) {
      const first = Object.values(pages)[0];
      const info = first?.imageinfo?.[0];
      if (info?.thumburl || info?.url) {
        const src = info.thumburl || info.url;
        const credit = info.extmetadata?.Artist?.value || "Wikimedia Commons";
        return { src, credit };
      }
    }
  }

  // Fallback: English Wikipedia pageimage
  const enwiki = entity.sitelinks?.enwiki?.title;
  if (enwiki) {
    const pi = new URL("https://en.wikipedia.org/w/api.php");
    pi.searchParams.set("action", "query");
    pi.searchParams.set("format", "json");
    pi.searchParams.set("prop", "pageimages");
    pi.searchParams.set("pithumbsize", "1600");
    pi.searchParams.set("titles", enwiki);
    pi.searchParams.set("origin", "*");
    const piData = await fetchJson(pi.toString());
    const pages = piData.query?.pages;
    if (pages) {
      const first = Object.values(pages)[0];
      const thumb = first?.thumbnail?.source;
      if (thumb) return { src: thumb, credit: enwiki + " — Wikipedia" };
    }
  }
  return null;
}

// Validate we didn't grab a random/incorrect image
function isValid({ country }, credit) {
  const s = (credit || "").toLowerCase();
  const c = (country || "").toLowerCase();
  const hasElectionWord = /(election|ballot|vot|poll|parliament|assembly|presidential|referendum)/i.test(s);
  const hasCountry = c ? s.includes(c) : true;
  return hasElectionWord && hasCountry;
}

// ---------- main ----------
(async () => {
  const files = await glob("src/posts/**/*.md");
  let filled = 0, skipped = 0, placeholders = 0, misses = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const fm = matter(raw);
    if (fm.data.image) { skipped++; continue; }

    const title = fm.data.title || slugFromFilename(file);
    const country = fm.data.country || "";
    const eyear = fm.data.election_year || (fm.data.date ? String(fm.data.date).slice(0,4) : "");
    const ename = fm.data.election_name || "";
    const category = firstCategory(fm);
    const postSlug = slugFromFilename(file);
    const y = yearFromFilename(file);
    const destRel = path.join("assets", "images", y, `${postSlug}.jpg`);
    const destAbs = path.join(process.cwd(), destRel);

    try {
      const qid = await findElectionQID({ election_name: ename, country, year: eyear, title });
      let chosen = null;

      if (qid) {
        const img = await getImageForQID(qid);
        if (img && isValid({ country }, img.credit)) {
          const res = await fetch(img.src);
          if (res.ok) {
            await ensureDir(destAbs);
            await fs.promises.writeFile(destAbs, Buffer.from(await res.arrayBuffer()));
            chosen = { src: "/" + destRel.replace(/\\/g, "/"), credit: img.credit };
          }
        }
      }

      if (!chosen) {
        // No risky guesses—use placeholder instead of wrong photo
        const ph = pickPlaceholder(category, country);
        const updated = matter.stringify(fm.content, { ...fm.data, image: ph, image_credit: "Placeholder" });
        fs.writeFileSync(file, updated, "utf8");
        placeholders++;
        continue;
      }

      const updated = matter.stringify(fm.content, { ...fm.data, image: chosen.src, image_credit: chosen.credit });
      fs.writeFileSync(file, updated, "utf8");
      console.log("[WIKI OK]", file, "->", destRel);
      filled++;
    } catch (e) {
      console.warn("[WIKI ERR]", file, e.message);
      misses++;
    }
  }

  console.log(`\nWikimedia pass → filled ${filled}, placeholders ${placeholders}, skipped (already had image) ${skipped}, errors ${misses}.`);
})();
