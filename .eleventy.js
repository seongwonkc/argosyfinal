// .eleventy.js
const path = require("path");

// Robust slugifier
const slugify = (s) =>
  (s || "")
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Date helpers
const isoDate = (date) => {
  try { return new Date(date).toISOString().slice(0, 10); } catch { return ""; }
};
const displayDate = (date, locale = "en-US") => {
  try {
    return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" })
      .format(new Date(date));
  } catch { return ""; }
};

// Supports `category: "Sports"` OR `categories: ["Sports","Health"]`
function normalizeCategories(data) {
  const out = [];
  const push = (name) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) return;
    const key = slugify(trimmed) || "uncategorized";
    if (!out.find((c) => c.key === key)) out.push({ name: trimmed, key });
  };
  if (Array.isArray(data.categories)) data.categories.forEach(push);
  else if (typeof data.categories === "string") push(data.categories);
  if (typeof data.category === "string") push(data.category);
  if (out.length === 0) out.push({ name: "Uncategorized", key: "uncategorized" });
  return out;
}

// Never spread Template objects in collections.
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

module.exports = function (eleventyConfig) {
  // -------- Filters --------
  eleventyConfig.addFilter("take", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("exceptByUrl", (arr, url) => (arr || []).filter((x) => x && x.url !== url));
  eleventyConfig.addFilter("slug", slugify);
  eleventyConfig.addFilter("isoDate", isoDate);
  eleventyConfig.addFilter("displayDate", displayDate);

  // Minimal date filter for {{ page.date | date('yyyy') }}
  eleventyConfig.addFilter("date", (value, fmt = "yyyy", locale = "en-US") => {
    const d = value ? new Date(value) : new Date();
    if (fmt === "yyyy") return String(d.getFullYear());
    return displayDate(d, locale);
  });

  // -------- Make normalizeCategories visible in Nunjucks templates/layouts --------
  eleventyConfig.addJavaScriptFunction("normalizeCategories", normalizeCategories);
  eleventyConfig.addNunjucksGlobal("normalizeCategories", normalizeCategories);

  // -------- Collections --------
  eleventyConfig.addCollection("posts", (collection) => {
    return collection
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

  eleventyConfig.addCollection("byCategory", (collection) => {
    const map = new Map();
    const posts = eleventyConfig.collections.posts(collection) || [];

    for (const item of posts) {
      const cats = item.data._allCategories || normalizeCategories(item.data);
      for (const { name, key } of cats) {
        const arr = map.get(key) || [];
        arr.push(viewOf(item, { _categoryName: name, _categoryKey: key }));
        map.set(key, arr);
      }
    }
    return Object.fromEntries(map);
  });

  eleventyConfig.addCollection("categoryList", (collection) => {
    const byCat = eleventyConfig.collections.byCategory(collection) || {};
    const list = Object.keys(byCat).map((key) => {
      const items = [...byCat[key]].sort((a, b) => (b.date || 0) - (a.date || 0));
      const name = items[0]?.data?._categoryName || key;
      return { key, name, count: items.length, items };
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  });

  // -------- Static / Dev server --------
  eleventyConfig.addPassthroughCopy({ "assets/": "assets" });
  eleventyConfig.addWatchTarget("assets/");
  eleventyConfig.setServerOptions({ showAllHosts: true, port: 8080 });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    passthroughFileCopy: true,
  };
};
