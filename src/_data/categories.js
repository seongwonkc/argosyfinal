/**
 * src/_data/categories.js
 *
 * Build a clean category list with merged aliases.
 */
module.exports = (collections) => {
  // All posts in the "posts" collection
  const posts = collections.posts || [];

  // --- Category Aliases & Grouping ---
  // key = final category slug, value = array of source names/slugs to merge
  const aliases = {
    sports: ['sports-analysis', 'sports-business'],
    health: ['medicine', 'public-health'],
    business: ['business'],            // convenience so you can assign either key or name
    editorials: ['editorial', 'editorials'],
    'social-issues': ['social-issues', 'society', 'social'],
  };

  // Helper: normalize a category string into a slug
  const slugify = (str) =>
    String(str || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');

  // Map every alias source to its final key
  const aliasMap = {};
  for (const [finalKey, sources] of Object.entries(aliases)) {
    for (const src of sources) aliasMap[slugify(src)] = finalKey;
  }

  // --- Build Category Buckets ---
  const buckets = {};

  for (const post of posts) {
    const raw = post.data.category || post.data.categories?.[0];
    if (!raw) continue;

    const key = aliasMap[slugify(raw)] || slugify(raw);
    const name =
      {
        sports: 'Sports',
        health: 'Health',
        business: 'Business',
        editorials: 'Editorials',
        'social-issues': 'Social Issues',
      }[key] || raw;

    if (!buckets[key]) {
      buckets[key] = { key, name, items: [] };
    }
    buckets[key].items.push(post);
  }

  // Return as a sorted array for easy looping in templates
  return Object.values(buckets).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
};
