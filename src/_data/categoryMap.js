// src/_data/categoryMap.js
// Canonical category map + all known aliases.

module.exports = {
  aliases: {
    // Communications
    "communications": "communications",
    "communication": "communications",
    "comms": "communications",

    // Culture
    "culture": "culture",
    "arts & culture": "culture",
    "arts and culture": "culture",

    // Economics & Finance  → keep as one combined category
    "economics and finance": "economics and finance",
    "economics": "economics and finance",
    "finance": "economics and finance",
    "econ & finance": "economics and finance",
    "econ and finance": "economics and finance",
    "economy": "economics and finance",

    // NEW: Business (separate from econ/finance for company/startup content)
    "business": "business",
    "entrepreneurship": "business",
    "startups": "business",
    "management": "business",
    "industry": "business",

    // Ethnography
    "ethnography": "ethnography",
    "anthropology": "ethnography",
    "anthro": "ethnography",

    // Food
    "food": "food",
    "dining": "food",
    "cuisine": "food",

    // Media
    "media": "media",
    "film & tv": "media",
    "film and tv": "media",
    "film": "media",
    "television": "media",
    "tv": "media",
    "journalism": "media",

    // Medicine + Public Health → merged to "health & medicine"
    "health & medicine": "health & medicine",
    "health and medicine": "health & medicine",
    "medicine": "health & medicine",
    "medical": "health & medicine",
    "healthcare": "health & medicine",
    "public health": "health & medicine",
    "public-health": "health & medicine",
    "epidemiology": "health & medicine",
    "population health": "health & medicine",
    "health": "health & medicine",

    // Politics
    "politics": "politics",
    "policy": "politics",
    "government": "politics",
    "govt": "politics",

    // Psychology
    "psychology": "psychology",
    "mental health": "psychology",
    "psych": "psychology",

    // NEW: Social Issues (broad society/justice/human-rights)
    "social issues": "social issues",
    "social-issues": "social issues",
    "society": "social issues",
    "social justice": "social issues",
    "justice": "social issues",
    "inequality": "social issues",
    "activism": "social issues",
    "human rights": "social issues",

    // Roundtable → keep as roundtable
    "roundtable": "roundtable",
    "the roundtable": "roundtable",
    "opinion roundtable": "roundtable",

    // NEW: Editorials (general opinion pieces outside roundtable)
    "editorials": "editorials",
    "editorial": "editorials",
    "opinion": "editorials",
    "commentary": "editorials",
    "perspective": "editorials",

    // Sports (merge micro-categories here)
    "sports": "sports",
    "sport": "sports",
    "sports analysis": "sports",
    "sports business": "sports",
    "athletics": "sports",

    // Travel
    "travel": "travel",
    "trips": "travel",
    "abroad": "travel"
  },

  // Order categories should appear in nav/homepage
  order: [
    "communications",
    "culture",
    "economics and finance",
    "business",
    "ethnography",
    "food",
    "media",
    "health & medicine",    // merged
    "politics",
    "psychology",
    "social issues",       // new
    "editorials",          // new
    "roundtable",
    "sports",
    "travel"
  ]
};
