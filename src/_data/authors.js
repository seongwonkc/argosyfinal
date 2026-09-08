// Staff avatar + role map, keyed by exact byline name.
// `flag` is the writer's chat color in roundtable threads (distinct per
// person; checked pairwise against every roundtable lineup).
// Multi-author bylines ("A and B", roundtable "By ...") get no single
// avatar; roundtables use the ship seal in the post layout instead.
module.exports = {
  "Ethan Yang":    { avatar: "/assets/images/avatars/ethan-yang.png",    role: "Editor-in-Chief",                          flag: "#414b59" },
  "Gawon Ryu":     { avatar: "/assets/images/avatars/gawon-ryu.png",     role: "Psychology Editor",                        flag: "#99395f" },
  "David Lee":     { avatar: "/assets/images/avatars/david-lee.png",     role: "Sustainability Editor",                    flag: "#33682e" },
  "Patrick Kim":   { avatar: "/assets/images/avatars/patrick-kim.png",   role: "Culture Editor",                           flag: "#7b3b72" },
  "Olivia Kim":    { avatar: "/assets/images/avatars/olivia-kim.png",    role: "Science & Health Writer",                  flag: "#96471a" },
  "Minwoo Jung":   { avatar: "/assets/images/avatars/minwoo-jung.png",   role: "Founding Editor-in-Chief",                 flag: "#8c2f2a" },
  "Yehee Jung":    { avatar: "/assets/images/avatars/yehee-jung.png",    role: "Science & Health Editor, 2023–2026",       flag: "#14656a" },
  "Saerom Kim":    { avatar: "/assets/images/avatars/saerom-kim.png",    role: "Culture Editor, 2023–2026",                flag: "#a34a2a" },
  "Yonghyuk Choi": { avatar: "/assets/images/avatars/yonghyuk-choi.png", role: "Sports Editor, 2023–2026",                 flag: "#2c4f8c" },
  "Anthony Min":   { avatar: "/assets/images/avatars/anthony-min.png",   role: "Economics & Finance Editor, 2023–2026",    flag: "#8a5a13" },
  "Jioh Lee":      { avatar: "/assets/images/avatars/jioh-lee.png",      role: "International & Education Writer, 2025–2026", flag: "#57613a" },
  "Kyusung Lee":   { avatar: "/assets/images/avatars/kyusung-lee.png",   role: "Sports & Society Contributor, 2025–2026",  flag: "#46536b" },
  "Peter Lee":     { avatar: "/assets/images/avatars/peter-lee.png",     role: "Health Editor",                            flag: "#14656a" },
  "Isacc Kim":     { avatar: "/assets/images/avatars/isacc-kim.png",     role: "Education Editor",                         flag: "#4b3d8f" },
  "Ejin Chung":    { avatar: "/assets/images/avatars/ejin-chung.png",    role: "Science & Technology Editor",              flag: "#0e5b4a" },
  "Doyeon Kim":    { avatar: "/assets/images/avatars/doyeon-kim.png",    role: "Politics Writer",                          flag: "#8c2f2a" }
};
