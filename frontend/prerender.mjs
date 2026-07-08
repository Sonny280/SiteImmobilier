// prerender.mjs — génère des HTML pré-remplis pour chaque page après vite build
// Exécuté via : node prerender.mjs
// Résultat : dist/bien/123/index.html, dist/contact/index.html, etc.
// Ces fichiers sont servis directement par le serveur avant que React ne charge,
// ce qui permet à Google et WhatsApp de lire le bon titre/description sans JS.

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST      = path.join(__dirname, "dist");
const BASE_HTML = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");

const SITE      = "ImmobilierCI";
const BASE_URL  = process.env.SITE_URL || "https://immobilierci.ci";
const API_URL   = process.env.VITE_API_URL || "http://localhost:3001/api";

// ── Injecte les meta tags dans le HTML de base ────────────────────
function injectMeta({ title, description, url, imageUrl }) {
  const ogImage = imageUrl
    ? `  <meta property="og:image" content="${imageUrl}"/>`
    : "";
  const inject = `
  <title>${title}</title>
  <meta name="description" content="${description}"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${description}"/>
  <meta property="og:url" content="${url}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="${SITE}"/>
  <meta property="og:locale" content="fr_CI"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${description}"/>
  <link rel="canonical" href="${url}"/>
${ogImage}`;

  // Injecte juste avant </head> — remplace aussi le <title> et les meta génériques
  return BASE_HTML
    .replace(/<title>[^<]*<\/title>/, "")
    .replace(/<meta name="description"[^>]*>/g, "")
    .replace(/<meta property="og:[^>]*>/g, "")
    .replace(/<meta name="twitter:[^>]*>/g, "")
    .replace(/<link rel="canonical"[^>]*>/g, "")
    .replace("</head>", inject + "\n</head>");
}

// ── Écrit un fichier HTML dans dist/ ─────────────────────────────
function writeHtml(routePath, meta) {
  const html    = injectMeta(meta);
  const dirPath = path.join(DIST, routePath.replace(/^\//, ""));
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, "index.html"), html, "utf-8");
  console.log(`✅  ${routePath}`);
}

// ── Pages statiques ───────────────────────────────────────────────
const STATIC = [
  {
    path: "/qui-sommes-nous",
    title: `Qui sommes-nous — ${SITE}`,
    description: "ImmobilierCI, agence immobilière agréée à Abidjan. Gestion locative, vente de biens et terrains en Côte d'Ivoire.",
  },
  {
    path: "/services",
    title: `Nos services immobiliers — ${SITE}`,
    description: "Location, meublé, vente, terrain, gestion locative à Abidjan et en Côte d'Ivoire. Découvrez notre catalogue de biens disponibles.",
  },
  {
    path: "/services/location",
    title: `Location mensuelle Abidjan — ${SITE}`,
    description: "Appartements et villas en location mensuelle à Cocody, Plateau, Marcory, Yopougon. Trouvez votre logement avec ImmobilierCI.",
  },
  {
    path: "/services/meuble",
    title: `Location meublée Abidjan — ${SITE}`,
    description: "Appartements meublés pour expatriés et cadres en mission à Abidjan. WiFi, électroménager, parking inclus.",
  },
  {
    path: "/services/vente",
    title: `Achat immobilier Abidjan — ${SITE}`,
    description: "Villas, appartements et duplex à vendre à Cocody, Plateau et Bingerville. Titre foncier vérifié, accompagnement notarial.",
  },
  {
    path: "/services/terrain",
    title: `Vente de terrains Côte d'Ivoire — ${SITE}`,
    description: "Terrains à vendre à Abidjan, Bingerville et intérieur du pays. Titres fonciers vérifiés, transactions sécurisées.",
  },
  {
    path: "/services/gestion",
    title: `Gestion locative Abidjan — ${SITE}`,
    description: "Confiez votre bien à ImmobilierCI. Sélection des locataires, suivi des loyers, taux de recouvrement 98–100%.",
  },
  {
    path: "/realisations",
    title: `Nos réalisations — ${SITE}`,
    description: "Découvrez les projets immobiliers menés avec succès par ImmobilierCI à Abidjan et en Côte d'Ivoire.",
  },
  {
    path: "/temoignages",
    title: `Témoignages clients — ${SITE}`,
    description: "Ce que disent nos clients sur ImmobilierCI. Note moyenne 5/5, 98% de satisfaction.",
  },
  {
    path: "/blog",
    title: `Blog immobilier Côte d'Ivoire — ${SITE}`,
    description: "Conseils immobiliers, actualité du marché ivoirien, guides pratiques pour investir à Abidjan.",
  },
  {
    path: "/contact",
    title: `Contactez ImmobilierCI — Agence immobilière Abidjan`,
    description: "Contactez ImmobilierCI à Abidjan. Réponse sous 24h, estimation gratuite, WhatsApp disponible.",
  },
];

// ── Récupère les biens depuis l'API et génère leur HTML ───────────
async function prerenderBiens() {
  console.log("\n📦 Pré-rendu des fiches de biens...");
  let biens = [];
  try {
    const res  = await fetch(`${API_URL}/biens?limit=500`);
    const data = await res.json();
    biens = data.biens || [];
    console.log(`   ${biens.length} bien(s) récupérés depuis l'API`);
  } catch(e) {
    console.warn(`⚠️  API inaccessible (${e.message}) — fiches de biens ignorées.`);
    console.warn("   Lancez le backend (node server.js) avant de pré-rendre pour inclure les biens.");
    return;
  }

  const TYPE_LABEL = { location:"Location", meuble:"Meublé", vente:"Vente", terrain:"Terrain" };
  const fmt = n => new Intl.NumberFormat("fr-CI").format(Math.round(n||0));

  for (const bien of biens) {
    const isSale = bien.type === "vente" || bien.type === "terrain";
    const typeLabel = TYPE_LABEL[bien.type] || bien.type;
    const prix  = `${fmt(bien.prix)} FCFA${!isSale ? "/mois" : ""}`;
    const title = `${bien.titre} — ${typeLabel} ${bien.quartier} — ${SITE}`;
    const desc  = [
      bien.titre,
      `à ${bien.quartier}, ${bien.commune}.`,
      bien.surface ? `${bien.surface}m²,` : "",
      bien.chambres > 0 ? `${bien.chambres} chambre${bien.chambres>1?"s":""}.` : "",
      prix,
      bien.description ? bien.description.slice(0, 100) + "…" : "",
    ].filter(Boolean).join(" ");
    const photo = (bien.photos||[]).find(p=>p.principale)?.url
                  || (bien.photos||[])[0]?.url
                  || null;
    writeHtml(`/bien/${bien.id}`, {
      title, description: desc.slice(0, 160),
      url: `${BASE_URL}/bien/${bien.id}`,
      imageUrl: photo,
    });
  }
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Pré-rendu ImmobilierCI → ${DIST}\n`);

  console.log("📄 Pages statiques...");
  for (const p of STATIC) {
    writeHtml(p.path, {
      title: p.title, description: p.description,
      url: `${BASE_URL}${p.path}`,
    });
  }

  await prerenderBiens();

  console.log("\n✅ Pré-rendu terminé.");
  console.log("   Uploadez le contenu de dist/ sur votre serveur.\n");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
