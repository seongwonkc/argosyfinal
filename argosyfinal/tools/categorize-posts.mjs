// tools/categorize-posts.mjs
// Auto-assigns `category` for posts that lack one, based on title/content keywords.
// Categories covered: politics, sports, culture, health, sustainability,
// technology, economics & finance, business, roundtable.
// Usage:
//   node tools/categorize-posts.mjs         # dry-run (prints plan, no changes)
//   node tools/categorize-posts.mjs --write # apply changes
//
// deps: npm i -D gray-matter glob

import fs from "fs";
import matter from "gray-matter";
import { glob } from "glob";

const WRITE = process.argv.includes("--write");

// Each rule: {cat: "category-name", re: /keyword-regex/i}
const RULES = [
  {
    cat: "sports",
    re: /\b(olympic|fifa|uefa|nba|mlb|nfl|nhl|premier league|la liga|serie a|bundesliga|match|game|fixture|tournament|league|cup|coach|manager|player|goal|score|season|playoffs|world cup|grand slam|tennis|golf|marathon|stadium|arena)\b/i,
  },
  {
    cat: "health",
    re: /\b(healthcare|public health|hospital|clinic|vaccine|vaccination|covid|disease|outbreak|epidemic|pandemic|mental health|wellbeing|who|cdc|nhs|kcdc|drug|medicine|medical|surgery|nurse|doctor|patient)\b/i,
  },
  {
    cat: "culture",
    re: /\b(museum|gallery|exhibition|film|cinema|movie|music|concert|album|theatre|theater|play|opera|ballet|festival|literature|book|novel|poetry|cultural|heritage|arts|artist)\b/i,
  },
  {
    cat: "sustainability",
    re: /\b(sustainable|sustainability|climate|carbon|renewable|solar|wind|geothermal|recycling|compost|biodiversity|ecosystem|environment|green energy|clean energy|eco-friendly|net zero)\b/i,
  },
  {
    cat: "technology",
    re: /\b(tech|technology|ai|artificial intelligence|machine learning|robotics|software|hardware|app|apps|cloud|saas|iot|semiconductor|chip|cybersecurity|blockchain|crypto|bitcoin|data center|server)\b/i,
  },
  {
    cat: "economics & finance",
    re: /\b(economy|economic|finance|financial|stock|equity|market|bond|currency|foreign exchange|forex|interest rate|inflation|gdp|recession|treasury|bank|banking|investment|investor|fund|fiscal|monetary)\b/i,
  },
  {
    cat: "business",
    re: /\b(business|startup|entrepreneur|corporation|company|firm|merger|acquisition|ipo|ceo|cfo|product launch|strategy|marketing|sales|supply chain|retail|wholesale|e-commerce|commerce)\b/i,
  },
  {
    cat: "roundtable",
    // Editors' group discussion—look for the keyword itself or typical phrasing
    re: /\b(roundtable|editorial board|monthly discussion|staff debate|editor discussion|opinion round)\b/i,
  },
  {
    cat: "politics", // catch-all if nothing else matches
    re: /\b(election|vote|ballot|campaign|candidate|party|coalition|parliament|assembly|congress|senate|minister|ministry|governor|mayor|cabinet|policy|referendum|president|prime minister|diplomacy|sanction|treaty)\b/i,
  },
];

// Fallback if no regex hits
const DEFAULT_CATEGORY = "politics";

function alreadyCategorized(fm) {
  if (fm.data.category && String(fm.data.category).trim()) return true;
  if (Array.isArray(fm.data.categories) && fm.data.categories.length) return true;
  return false;
}

function pickCategory(text) {
  for (const r of RULES) if (r.re.test(text)) return r.cat;
  return DEFAULT_CATEGORY;
}

function summarize(s, n = 80) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

(async () => {
  const files = await glob("src/posts/**/*.md");
  let changed = 0, skipped = 0, none = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const fm = matter(raw);

    if (alreadyCategorized(fm)) { skipped++; continue; }

    const title = (fm.data.title || "").toString();
    const body = fm.content || "";
    const excerpt = (fm.data.excerpt || fm.data.summary || "").toString();
    const haystack = [title, excerpt, body].join("\n").toLowerCase();

    const cat = pickCategory(haystack);
    if (!cat) { none++; continue; }

    if (WRITE) {
      const updated = matter.stringify(fm.content, { ...fm.data, category: cat });
      fs.writeFileSync(file, updated, "utf8");
    }

    console.log(`${WRITE ? "[SET ]" : "[PLAN]"} ${file}  →  category: ${cat}   (${summarize(title || body)})`);
    changed++;
  }

  console.log(`\nDone. ${WRITE ? "Updated" : "Would update"} ${changed}, skipped ${skipped}, no-match ${none}.`);
})();
