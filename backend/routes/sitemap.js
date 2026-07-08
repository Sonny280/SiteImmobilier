// routes/sitemap.js — génère un sitemap.xml dynamique incluant les pages
// statiques et chaque bien publié. Accessible publiquement, sans auth.
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");

const BASE_URL = process.env.SITE_URL || "https://immobilierci.ci";

// Pages statiques du site — gardées en phase avec frontend/src/seo.js → SEO_PAGES
const STATIC_PAGES = [
  { path: "/",                     priority: "1.0", freq: "daily"   },
  { path: "/qui-sommes-nous",      priority: "0.6", freq: "monthly" },
  { path: "/services",             priority: "0.9", freq: "weekly"  },
  { path: "/services/location",    priority: "0.8", freq: "weekly"  },
  { path: "/services/meuble",      priority: "0.8", freq: "weekly"  },
  { path: "/services/vente",       priority: "0.8", freq: "weekly"  },
  { path: "/services/terrain",     priority: "0.8", freq: "weekly"  },
  { path: "/services/gestion",     priority: "0.7", freq: "monthly" },
  { path: "/realisations",         priority: "0.6", freq: "monthly" },
  { path: "/temoignages",          priority: "0.6", freq: "monthly" },
  { path: "/blog",                 priority: "0.7", freq: "weekly"  },
  { path: "/contact",              priority: "0.6", freq: "monthly" },
  { path: "/calculatrice",         priority: "0.5", freq: "monthly" },
];

router.get("/sitemap.xml", (_, res) => {
  const biens = prepare(
    "SELECT id, updatedAt FROM biens WHERE statut != 'archive'"
  ).all();

  const articles = prepare(
    "SELECT id, updatedAt FROM articles WHERE statut = 'publie'"
  ).all();

  const urlEntries = [
    ...STATIC_PAGES.map(p => `  <url>
    <loc>${BASE_URL}${p.path}</loc>
    <changefreq>${p.freq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...biens.map(b => `  <url>
    <loc>${BASE_URL}/bien/${b.id}</loc>
    <lastmod>${(b.updatedAt || new Date().toISOString()).slice(0,10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`),
    ...articles.map(a => `  <url>
    <loc>${BASE_URL}/blog/${a.id}</loc>
    <lastmod>${(a.updatedAt || new Date().toISOString()).slice(0,10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>`;

  res.set("Content-Type", "application/xml");
  res.send(xml);
});

module.exports = router;
