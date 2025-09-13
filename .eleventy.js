// .eleventy.js
const path = require("path");
const catMap = require("./src/_data/categoryMap.js");

/* ----------------------- Helpers ----------------------- */

// Robust slugifier (diacritics → ascii, spaces → dashes)
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
    .replace(/(^-|-$)/g, "");

// ISO date (yyyy-mm-dd)
const isoDate = (date) => {
  try {
    return new Date(date).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

// Nice display date
const displayDate = (date, locale = "en-US") => {
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return "";
  }
};

// Map a raw category string → canonical (via aliases)
function canonicalName(raw) {
  if (!raw) return "";
  const key = String(raw).trim().toLowerCase();
  return catMap.aliases?.[key] || key;
}

// Title-case for display (keeps & and small words)
function displayName(canon) {
  const small = new Set(["and", "of", "the", "a", "an", "in", "on"]);
  return String(canon)
    .split(" ")
    .map((w, i) => {
      const lw = w.toLowerCase();
      if (lw === "&") return "&";
      if (i > 0 && small.has(lw)) return lw;
      return lw.charAt(0).toUpperCase() + lw.slice(1);
    })
    .join(" ");
}

// Supports `category: "Sports"` OR `categories: ["Sports","Health"]`
// Returns array [{name, key}] with canonicalization + slug keys
function normalizeCategories(data) {
  const set = new Map();

  const pushOne = (name) => {
    const raw = String(name || "").trim();
    if (!raw) return;
    const canon = canonicalName(raw);              // apply alias map
    const key = slugify(canon) || "uncategorized";
    const nameOut = displayName(canon);
    if (!set.has(key)) set.set(key, { name: nameOut, key });
  };

  if (Array.isArray(data?.categories)) data.categories.forEach(pushOne);
  else if (typeof data?.categories === "string") pushOne(data.categories);

  if (typeof data?.category === "string") pushOne(data.category);

  if (set.size === 0) set.set("uncategorized", { name: "Uncategorized", key: "uncategorized" });
  return Array.from(set.values());
}

// Safe, lean view of an Eleventy item (don’t spread Template objects)
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

  // Posts: src/posts/**/*.md (sorted newest → oldest), with category metadata
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

  // categories: merged + ordered using src/_data/categoryMap.js
  eleventyConfig.addCollection("categories", (api) => {
    const posts = api.getFilteredByTag("posts"); // the "posts" collection we defined above
    const buckets = new Map();

    for (const p of posts) {
      const cats = p.data._allCategories || normalizeCategories(p.data);
      const primary = cats[0];
      if (!primary) continue;

      if (!buckets.has(primary.key)) {
        buckets.set(primary.key, { key: primary.key, name: primary.name, items: [] });
      }
      buckets.get(primary.key).items.push(p);
    }

    let list = Array.from(buckets.values());

    // Apply explicit order if provided
    if (Array.isArray(catMap.order) && catMap.order.length) {
      const orderIndex = new Map(catMap.order.map((n, i) => [slugify(n), i]));
      list.sort((a, b) => {
        const ai = orderIndex.has(a.key) ? orderIndex.get(a.key) : 9999;
        const bi = orderIndex.has(b.key) ? orderIndex.get(b.key) : 9999;
        return ai - bi || a.name.localeCompare(b.name);
      });
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  });

  // Optional: byCategory lookup (key → array of posts)
  eleventyConfig.addCollection("byCategory", (api) => {
    const map = new Map();
    const posts = api.getFilteredByTag("posts");

    for (const p of posts) {
      const cats = p.data._allCategories || normalizeCategories(p.data);
      for (const c of cats) {
        if (!map.has(c.key)) map.set(c.key, []);
        map.get(c.key).push(viewOf(p, { _categoryName: c.name, _categoryKey: c.key }));
      }
    }
    // Sort each bucket newest → oldest
    for (const [k, arr] of map) {
      arr.sort((a, b) => (b.date || 0) - (a.date || 0));
    }
    return Object.fromEntries(map);
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
