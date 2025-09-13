const categoryMap = require("./categoryMap");

module.exports = function(collectionApi) {
  const normalized = {};

  collectionApi.getAll().forEach(item => {
    const cats = item.data.categories || item.data.category;
    if (!cats) return;

    [].concat(cats).forEach(raw => {
      const key = raw.toLowerCase();
      // find the display category whose key or aliases match
      const found = Object.entries(categoryMap).find(
        ([, cfg]) =>
          key === cfg.name.toLowerCase().replace(/\s+/g, "-") ||
          cfg.aliases.includes(key)
      );
      if (found) {
        const [mainKey, cfg] = found;
        if (!normalized[mainKey]) normalized[mainKey] = { key: mainKey, name: cfg.name, items: [] };
        normalized[mainKey].items.push(item);
      }
    });
  });

  // turn into an array sorted by name if you like
  return Object.values(normalized).sort((a,b)=>a.name.localeCompare(b.name));
};
