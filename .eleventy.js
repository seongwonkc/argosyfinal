// .eleventy.js
const catMap = require("./src/_data/categoryMap.js");

/* ----------------------- Helpers ----------------------- */

// Robust slugifier
const slugify = (s) =>
  (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "") || "uncategorized";

// Map a raw category string → canonical name via aliases map.
// Aliases are keyed in slug form ("sports-analysis"), but raw categories
// arrive in space form ("Sports Analysis") — check both, else the alias
// silently misses and intended merges (sports, health & medicine) never happen.
function canonicalName(raw) {
  if (!raw) return "";
  const key = String(raw).trim().toLowerCase();
  const aliases = catMap.aliases || {};
  return aliases[key] || aliases[slugify(key)] || key;
}

// Title-case for display (keeps small words)
function displayName(canon) {
  const small = new Set(["and", "of", "the", "a", "an", "in", "on"]);
  const words = String(canon || "").split(/[\s-]+/g);
  return words
    .map((w, i) => {
      const low = w.toLowerCase();
      if (i > 0 && small.has(low)) return low;
      return low.charAt(0).toUpperCase() + low.slice(1);
    })
    .join(" ")
    .replace(/\bAnd\b/g, "and");
}

// Normalize categories from front-matter:
// supports `category: "Sports"` and/or `categories: ["Sports", "Health"]`
function normalizeCategories(data) {
  const out = [];
  const push = (name) => {
    const raw = (name || "").toString().trim();
    if (!raw) return;
    const canon = canonicalName(raw) || raw.toLowerCase();
    const key = slugify(canon);
    const nice = displayName(canon);
    if (!out.find((c) => c.key === key)) out.push({ name: nice, key });
  };
  if (Array.isArray(data.categories)) data.categories.forEach(push);
  else if (typeof data.categories === "string") push(data.categories);
  if (typeof data.category === "string") push(data.category);

  if (!out.length) out.push({ name: "Uncategorized", key: "uncategorized" });
  return out;
}

const isoDate = (date) => {
  try { return new Date(date).toISOString().slice(0, 10); } catch { return ""; }
};
const displayDate = (date, locale = "en-US") => {
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" })
      .format(new Date(date));
  } catch { return ""; }
};

// Safe view of a template object (avoid spreading Eleventy Templates)
function viewOf(item, extraData = {}) {
  return {
    url: item.url,
    date: item.date,
    fileSlug: item.fileSlug,
    filePathStem: item.filePathStem,
    inputPath: item.inputPath,
    outputPath: item.outputPath,
    data: { ...item.data, ...extraData },
  };
}

/* ----------------------- Eleventy ----------------------- */

module.exports = function (eleventyConfig) {
  /* ---- Filters ---- */
  eleventyConfig.addFilter("take", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("readingTime", (html) => {
    const words = String(html || "").replace(/<[^>]+>/g, " ").trim().split(/\s+/).length;
    return `${Math.max(1, Math.round(words / 230))} min read`;
  });

  /* ---- Roundtable chat transform ----
     Rewrites a roundtable transcript's rendered HTML into a chat thread:
     <p><strong>Name:</strong> text</p> becomes an avatar-attributed bubble,
     consecutive messages from one speaker group together, bracketed stage
     directions become centered system lines, italic paragraphs become the
     editor's note / outro, and "Final Thoughts" becomes a divider. If the
     content doesn't look like a transcript (under 3 speaker turns), the
     original HTML is returned untouched. */
  const chatAuthors = require("./src/_data/authors.js");
  const SEAL = "/assets/images/seal.png";
  eleventyConfig.addFilter("chatify", (html) => {
    const src = String(html || "");
    const blockRe = /<h3[^>]*>[\s\S]*?<\/h3>|<p[^>]*>[\s\S]*?<\/p>|<hr[^>]*>/g;
    const blocks = src.match(blockRe) || [];
    if (!blocks.length) return src;

    const speakerRe = /^<p[^>]*><strong>([^<]{1,60}?)(?:\s*\(continuing\))?\s*:<\/strong>\s*([\s\S]*)<\/p>$/;
    const parsed = [];
    let speakerTurns = 0;
    for (const b of blocks) {
      const m = b.match(speakerRe);
      if (m) {
        parsed.push({ kind: "msg", who: m[1].trim(), text: m[2].trim() });
        speakerTurns++;
      } else if (/^<h3[^>]*>[\s\S]*Final Thoughts[\s\S]*<\/h3>$/i.test(b)) {
        parsed.push({ kind: "final" });
      } else if (/^<hr/.test(b)) {
        parsed.push({ kind: "rule" });
      } else if (/^<p[^>]*><em>[\s\S]*<\/em>\s*<\/p>$/.test(b)) {
        parsed.push({ kind: "note", htmlBlock: b });
      } else {
        parsed.push({ kind: "plain", htmlBlock: b });
      }
    }
    if (speakerTurns < 3) return src;

    const sysText = (t) => {
      const m = t.match(/^\[([\s\S]*)\]$/);
      return m ? m[1] : null;
    };

    let out = "";
    let openChat = false;
    let lastWho = null;
    let noteSeen = false;
    const openChatDiv = () => { if (!openChat) { out += '<div class="rt-chat">'; openChat = true; lastWho = null; } };
    const closeMsg = () => { if (lastWho !== null) { out += "</div></div>"; lastWho = null; } };
    const closeChat = () => { if (openChat) { closeMsg(); out += "</div>"; openChat = false; } };

    for (const item of parsed) {
      if (item.kind === "msg") {
        const sys = sysText(item.text) || (item.who === "All" ? item.text.replace(/^\[|\]$/g, "") : null);
        if (item.who === "All" || sys !== null) {
          openChatDiv(); closeMsg();
          out += `<div class="rt-system">${sys !== null ? sys : item.text}</div>`;
          continue;
        }
        openChatDiv();
        const a = chatAuthors[item.who];
        const flag = a && a.flag ? a.flag : "#1d2733";
        const avatar = a && a.avatar ? a.avatar : SEAL;
        if (item.who !== lastWho) {
          closeMsg();
          out += `<div class="msg" style="--who:${flag}">` +
                 `<img class="chat-avatar" src="${avatar}" alt="" width="72" height="72" loading="lazy">` +
                 `<div class="msg-body"><span class="who sc">${item.who}</span>`;
          lastWho = item.who;
        }
        out += `<div class="bubble">${item.text}</div>`;
      } else if (item.kind === "final") {
        closeChat();
        out += '<div class="rt-divider sc"><span>Closing statements</span></div>';
      } else if (item.kind === "rule") {
        closeMsg();
      } else if (item.kind === "note") {
        closeChat();
        out += `<div class="${noteSeen ? "rt-outro" : "rt-note"}">${item.htmlBlock}</div>`;
        noteSeen = true;
      } else {
        closeChat();
        out += item.htmlBlock;
      }
    }
    closeChat();
    return out;
  });
  // Worksheet writing space: <div class="lines" style="--n:3"></div> becomes
  // three ruled rows. Real borders print; background gradients get dropped.
  eleventyConfig.addFilter("worksheetLines", (html) =>
    String(html || "").replace(/<div class="lines" style="--n:(\d+)"><\/div>/g,
      (_, n) => `<div class="lines">${"<i></i>".repeat(Number(n))}</div>`));
  eleventyConfig.addFilter("exceptByUrl", (arr, url) => (arr || []).filter((x) => x && x.url !== url));
  eleventyConfig.addFilter("slug", slugify);
  eleventyConfig.addFilter("isoDate", isoDate);
  eleventyConfig.addFilter("displayDate", displayDate);
  // Minimal "date" filter for {{ page.date | date('yyyy') }}
  eleventyConfig.addFilter("date", (value, fmt = "yyyy", locale = "en-US") => {
    const d = value ? new Date(value) : new Date();
    if (fmt === "yyyy") return String(d.getFullYear());
    return displayDate(d, locale);
  });

  /* ---- Drafts ----
     Production builds skip anything marked `draft: true`, any post dated in
     the future, and the NIE page until src/_data/nie.json says live. The dev
     server (`npm run dev`) still renders them so they can be previewed. */
  // A bracketed all-caps placeholder like [N] or [PARTNER SCHOOL(S)], not a
  // markdown link. Pages that would publish with one fail the build.
  const PLACEHOLDER = /\[(?=[^\]]*[A-Z]{2}|N\])[A-Z0-9 ,.:\/&()'’—–+-]+\](?!\()/;
  eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
    if (process.env.ELEVENTY_RUN_MODE !== "build") return;
    if (data.draft === true) return false;
    if (data.nieProgramPage && !(data.nie && data.nie.live)) return false;
    if (data.layout === "layouts/post.njk" && data.date && new Date(data.date) > new Date()) return false;
    const ph = String(content || "").match(PLACEHOLDER);
    if (ph) throw new Error(`${data.page.inputPath} still has the placeholder ${ph[0]}. Fill it in, or mark the page draft.`);
  });

  /* ---- Expose normalizeCategories to Nunjucks ---- */
  eleventyConfig.addJavaScriptFunction("normalizeCategories", normalizeCategories);
  eleventyConfig.addNunjucksGlobal("normalizeCategories", normalizeCategories);

  /* ---- Collections ---- */

  // All posts (newest → oldest) with primary + all categories computed
  eleventyConfig.addCollection("posts", (api) => {
    return api
      .getFilteredByGlob("src/posts/**/*.md")
      .sort((a, b) => (b.date || 0) - (a.date || 0))
      .map((item) => {
        const cats = normalizeCategories(item.data);
        const primary = cats[0];
        return viewOf(item, {
          _primaryCategoryName: primary.name,
          _primaryCategoryKey: primary.key,
          _allCategories: cats,
        });
      });
  });

  // Map: key → array of posts in that category
  eleventyConfig.addCollection("byCategory", (api) => {
    const map = new Map();
    const posts = eleventyConfig.collections.posts(api) || [];
    for (const item of posts) {
      const cats = item.data._allCategories || normalizeCategories(item.data);
      for (const { name, key } of cats) {
        const arr = map.get(key) || [];
        arr.push(viewOf(item, { _categoryName: name, _categoryKey: key }));
        map.set(key, arr);
      }
    }
    // Sort each bucket newest → oldest
    for (const [k, arr] of map) {
      arr.sort((a, b) => (b.date || 0) - (a.date || 0));
    }
    return Object.fromEntries(map);
  });

  // ✅ The missing piece: flat list the templates expect
  // [{ key, name, count, items }]
  eleventyConfig.addCollection("categoryList", (api) => {
    const byCat = eleventyConfig.collections.byCategory(api) || {};
    const list = Object.keys(byCat).map((key) => {
      const items = byCat[key];
      const name = items[0]?.data?._categoryName || displayName(key.replace(/-/g, " "));
      return { key, name, count: items.length, items };
    });

    // Optional: order according to src/_data/categoryMap.js → order[]
    const order = (catMap.order || []).map((s) => slugify(canonicalName(s)));
    list.sort((a, b) => {
      const ia = order.indexOf(a.key);
      const ib = order.indexOf(b.key);
      if (ia !== -1 || ib !== -1) {
        return (ia === -1 ? 9e9 : ia) - (ib === -1 ? 9e9 : ib);
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  });

  /* ---- Static / Dev server ---- */
  // NIE worksheet PDFs ship only once the program page is live.
  const nieLive = require("./src/_data/nie.json").live;
  eleventyConfig.addPassthroughCopy({ "assets/": "assets" }, {
    filter: (p) => nieLive || !String(p).replace(/\\/g, "/").startsWith("nie/"),
  });
  eleventyConfig.addWatchTarget("assets/");
  eleventyConfig.setServerOptions({ showAllHosts: true, port: 8080 });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    passthroughFileCopy: true,
  };
};
