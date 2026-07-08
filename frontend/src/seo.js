// seo.js — Gestion dynamique des balises SEO pour ImmobilierCI
// Modifie <title>, <meta name="description">, <meta name="keywords">,
// Open Graph (og:title, og:description, og:url) et canonical
// à chaque changement de page — sans react-helmet.

const SITE = "ImmobilierCI";
const BASE_URL = import.meta.env.VITE_SITE_URL || "https://immobilierci.ci";

// ── Données SEO par page ──────────────────────────────────────────
export const SEO_PAGES = {
  accueil: {
    title: `${SITE} — Agence Immobilière Agréée · Abidjan, Côte d'Ivoire`,
    description: "ImmobilierCI, agence immobilière agréée à Abidjan. Location, appartements meublés, vente de maisons, terrains et gestion locative sur toute la Côte d'Ivoire. Réponse sous 24h.",
    keywords: "agence immobilière Abidjan, location appartement Côte d'Ivoire, appartement meublé Abidjan, villa à vendre Abidjan, gestion locative CI, ImmobilierCI",
    path: "/",
  },
  "qui-sommes-nous": {
    title: `Qui sommes-nous — ${SITE} · Agence Immobilière Abidjan`,
    description: "Découvrez ImmobilierCI, agence immobilière agréée fondé par Kouassi Atse Charles. 3 ans d'expérience, transparence totale, présence sur toute la Côte d'Ivoire.",
    keywords: "ImmobilierCI présentation, Kouassi Atse Charles immobilier, agence agréée Abidjan, immobilier Côte d'Ivoire",
    path: "/qui-sommes-nous",
  },
  services: {
    title: `Nos Services Immobiliers — ${SITE} · Location, Vente, Gestion`,
    description: "Gestion locative, location meublée et non meublée, vente de biens et terrains à Abidjan et dans toute la Côte d'Ivoire. Estimation gratuite par ImmobilierCI.",
    keywords: "services immobiliers Abidjan, gestion locative Cocody, location meublée expatriés, vente maison Abidjan, terrain à vendre CI",
    path: "/services",
  },
  "services-location": {
    title: `Location Mensuelle à Abidjan — ${SITE}`,
    description: "Appartements et villas en location longue durée à Abidjan (Cocody, Marcory, Plateau, Angré…). Baux conformes, états des lieux professionnels. ImmobilierCI.",
    keywords: "location appartement Abidjan, location villa Cocody, location mensuelle CI, bail location Abidjan",
    path: "/services/location",
  },
  "services-meuble": {
    title: `Appartements Meublés à Abidjan — ${SITE}`,
    description: "Appartements et villas entièrement meublés à Abidjan pour expatriés, cadres en mission et familles en transit. WiFi inclus. ImmobilierCI.",
    keywords: "appartement meublé Abidjan, meublé expatrié Côte d'Ivoire, location courte durée Abidjan, résidence meublée Cocody",
    path: "/services/meuble",
  },
  "services-vente": {
    title: `Vente Immobilière à Abidjan — ${SITE}`,
    description: "Achetez ou vendez votre appartement, villa ou immeuble à Abidjan. Estimation gratuite, négociation professionnelle, accompagnement notarial. ImmobilierCI.",
    keywords: "vente maison Abidjan, acheter appartement Côte d'Ivoire, villa à vendre Cocody, investissement immobilier Abidjan",
    path: "/services/vente",
  },
  "services-terrain": {
    title: `Terrains à Vendre — Abidjan & Intérieur — ${SITE}`,
    description: "Terrains résidentiels et commerciaux à vendre à Abidjan (Bingerville, Bassam, Songon) et à l'intérieur de la Côte d'Ivoire. Titres fonciers vérifiés. ImmobilierCI.",
    keywords: "terrain à vendre Abidjan, terrain Bingerville, terrain Bassam CI, titre foncier Côte d'Ivoire, achat terrain Abidjan",
    path: "/services/terrain",
  },
  "services-gestion": {
    title: `Gestion Locative Professionnelle — ${SITE} · Abidjan`,
    description: "Confiez la gestion de votre bien à ImmobilierCI : recherche locataires, suivi loyers, états des lieux, renouvellements. Taux de recouvrement 98–100%.",
    keywords: "gestion locative Abidjan, gérer son bien immobilier CI, agence gestion locative Côte d'Ivoire, propriétaire bailleur Abidjan",
    path: "/services/gestion",
  },
  realisations: {
    title: `Nos Réalisations — Portfolio Immobilier — ${SITE}`,
    description: "Découvrez les projets réalisés par ImmobilierCI : gestion locative, ventes de villas, locations meublées pour expatriés, terrains sécurisés à Abidjan et en Côte d'Ivoire.",
    keywords: "réalisations immobilières Abidjan, portfolio agence immobilière CI, ventes réussies Côte d'Ivoire, ImmobilierCI projets",
    path: "/realisations",
  },
  temoignages: {
    title: `Avis Clients — Témoignages — ${SITE}`,
    description: "Ce que disent nos clients : 98% de satisfaction, plus de 100 avis. Découvrez les témoignages de propriétaires, locataires et acheteurs accompagnés par ImmobilierCI.",
    keywords: "avis ImmobilierCI, témoignages agence immobilière Abidjan, clients satisfaits immobilier CI",
    path: "/temoignages",
  },
  blog: {
    title: `Blog Immobilier — Conseils & Actualités — ${SITE}`,
    description: "Conseils immobiliers, actualité du marché abidjanais, guide du titre foncier, quartiers à fort potentiel. Le blog de ImmobilierCI pour bien investir en Côte d'Ivoire.",
    keywords: "blog immobilier Abidjan, conseils investissement CI, marché immobilier Côte d'Ivoire, quartiers Abidjan 2025",
    path: "/blog",
  },
  contact: {
    title: `Contact — ${SITE} · +225 07 57 86 48 36`,
    description: "Contactez ImmobilierCI : +225 07 57 86 48 36, WhatsApp +225 07 57 86 48 36, contact@immobilierci.ci. Lun–Ven 8h30–17h30. Réponse garantie sous 24h.",
    keywords: "contact ImmobilierCI, agence immobilière Abidjan téléphone, WhatsApp immobilier CI, rendez-vous agence Abidjan",
    path: "/contact",
  },
  calculatrice: {
    title: `Calculatrice Immobilière Gratuite — ${SITE}`,
    description: "Calculez votre budget locatif, simulez un crédit immobilier et estimez le rendement de votre investissement en Côte d'Ivoire. Outil gratuit ImmobilierCI.",
    keywords: "calculatrice immobilière Abidjan, simulation crédit immobilier CI, budget loyer Côte d'Ivoire, rendement locatif Abidjan",
    path: "/calculatrice",
  },
};

// ── Génère les données SEO pour un bien spécifique ────────────────
export function getSeoForBien(bien) {
  if (!bien) return SEO_PAGES.services;
  const isSale = bien.type === "vente" || bien.type === "terrain";
  const typeLabel = {
    location: "Location",
    meuble:   "Meublé",
    vente:    "Vente",
    terrain:  "Terrain",
  }[bien.type] || bien.type;
  return {
    title: `${bien.titre} — ${typeLabel} ${bien.quartier} — ${SITE}`,
    description: `${bien.titre} à ${bien.quartier}, ${bien.ville}. ${bien.surface ? bien.surface+"m², " : ""}${bien.chambres > 0 ? bien.chambres+" chambres, " : ""}${new Intl.NumberFormat("fr-CI").format(bien.prix)} FCFA${!isSale ? "/mois" : ""}. ${bien.description ? bien.description.slice(0, 100)+"…" : "ImmobilierCI, agence immobilière Abidjan."}`,
    keywords: `${bien.titre}, ${typeLabel} ${bien.quartier}, immobilier ${bien.commune||bien.ville}, ${bien.ref}, ImmobilierCI`,
    path: `/bien/${bien.id}`,
    jsonLd: buildBienJsonLd(bien, isSale),
  };
}

// ── Données structurées Schema.org pour une fiche de bien ─────────
// Permet à Google d'afficher prix, photo et localisation directement dans
// les résultats de recherche (résultats enrichis), au lieu d'un simple lien.
// Référence : https://schema.org/RealEstateListing
function buildBienJsonLd(bien, isSale) {
  const photos = (bien.photos || []).map(p => p.url).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": bien.titre,
    "description": bien.description || `${bien.titre} à ${bien.quartier}, ${bien.ville}`,
    "url": `${BASE_URL}/bien/${bien.id}`,
    ...(photos.length ? { "image": photos } : {}),
    "address": {
      "@type": "PostalAddress",
      "addressLocality": bien.quartier || bien.commune,
      "addressRegion": bien.commune || bien.ville,
      "addressCountry": "CI",
    },
    "offers": {
      "@type": "Offer",
      "price": bien.prix,
      "priceCurrency": "XOF",
      "availability": bien.statut === "disponible" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "businessFunction": isSale ? "https://schema.org/Sell" : "https://schema.org/LeaseOut",
    },
    ...(bien.surface ? { "floorSize": { "@type": "QuantitativeValue", "value": bien.surface, "unitCode": "MTK" } } : {}),
    ...(bien.chambres ? { "numberOfRooms": bien.chambres } : {}),
  };
}

// ── Applique les balises SEO dans le DOM ──────────────────────────
export function applySeo({ title, description, keywords, path, jsonLd }) {
  // <title>
  document.title = title;

  // Helpers
  const setMeta = (selector, content) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      const [attr, val] = selector.includes("[property")
        ? ["property", selector.match(/property="([^"]+)"/)[1]]
        : ["name",     selector.match(/name="([^"]+)"/)[1]];
      el.setAttribute(attr, val);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };

  const setLink = (rel, href) => {
    let el = document.querySelector(`link[rel="${rel}"]`);
    if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
    el.setAttribute("href", href);
  };

  // Meta de base
  setMeta(`meta[name="description"]`,         description);
  setMeta(`meta[name="keywords"]`,            keywords || "");
  setMeta(`meta[name="robots"]`,              "index, follow");

  // Open Graph
  setMeta(`meta[property="og:title"]`,        title);
  setMeta(`meta[property="og:description"]`,  description);
  setMeta(`meta[property="og:type"]`,         "website");
  setMeta(`meta[property="og:locale"]`,       "fr_CI");
  setMeta(`meta[property="og:site_name"]`,    SITE);
  if (path) setMeta(`meta[property="og:url"]`, `${BASE_URL}${path}`);

  // Twitter Card
  setMeta(`meta[name="twitter:card"]`,        "summary");
  setMeta(`meta[name="twitter:title"]`,       title);
  setMeta(`meta[name="twitter:description"]`, description);

  // Canonical
  if (path) setLink("canonical", `${BASE_URL}${path}`);

  // Données structurées Schema.org — uniquement présentes sur les fiches de
  // bien (jsonLd fourni par getSeoForBien). On retire l'ancien script avant
  // d'en poser un nouveau pour éviter d'accumuler plusieurs balises lors de
  // la navigation entre fiches dans cette SPA.
  let ldScript = document.getElementById("seo-jsonld");
  if (jsonLd) {
    if (!ldScript) {
      ldScript = document.createElement("script");
      ldScript.id = "seo-jsonld";
      ldScript.type = "application/ld+json";
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify(jsonLd);
  } else if (ldScript) {
    ldScript.remove();
  }
}

// ── Hook React pratique ───────────────────────────────────────────
import { useEffect } from "react";

export function useSeo(pageKey, bien = null) {
  useEffect(() => {
    const data = bien
      ? getSeoForBien(bien)
      : (SEO_PAGES[pageKey] || SEO_PAGES.accueil);
    applySeo(data);
  }, [pageKey, bien?.id]);
}
