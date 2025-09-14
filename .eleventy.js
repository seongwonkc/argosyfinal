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

// Map a raw category string → canonical name via aliases map
function canonicalName(raw) {
  if (!raw) return "";
  const key = String(raw).trim().toLowerCase();
  return (catMap.aliases && catMap.aliases[key]) || key;
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
  eleventyConfig.addPassthroughCopy({ "assets/": "assets" });
  eleventyConfig.addWatchTarget("assets/");
  eleventyConfig.setServerOptions({ showAllHosts: true, port: 8080 });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    passthroughFileCopy: true,
  };
};
