// src/_data/categoryMap.js
module.exports = {
  // Display order (left→right in nav, top→bottom in lists)
  order: [
    "communications",
    "culture",
    "economics and finance",
    "health & medicine",
    "politics",
    "psychology",
    "roundtable",
    "sports"
  ],

  // Aliases: lowercase left side → canonical lowercase name (used by .eleventy.js)
  aliases: {
    // Merge micro sports into Sports
    "sports-analysis": "sports",
    "sports-business": "sports",

    // Medicine + Public Health → Health & Medicine
    "medicine": "health & medicine",
    "public-health": "health & medicine",
    "health": "health & medicine",

    // Fold these into Culture
    "travel": "culture",
    "ethnography": "culture",
    "food": "culture",

    // Normalize common variants
    "econ": "economics and finance",
    "economics": "economics and finance",

    // Pass-through (optional)
    "roundtable": "roundtable",
    "communications": "communications",
    "culture": "culture",
    "politics": "politics",
    "psychology": "psychology",
    "sports": "sports"
  }
};
