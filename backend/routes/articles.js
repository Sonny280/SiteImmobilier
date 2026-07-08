// routes/articles.js — Blog & Actualités ImmobilierCI
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, requireRole } = require("../middleware/auth");

// Génère un slug unique depuis le titre
async function makeSlug(titre, id) {
  const base = titre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"") // enlève accents
    .replace(/[^a-z0-9\s-]/g,"")
    .trim().replace(/\s+/g,"-")
    .slice(0,80);
  return `${base}-${id}`;
}

// ── GET /api/articles — liste publique (publiés) ──────────────────
router.get("/", async (req, res) => {
  const { statut, categorie, limit } = req.query;
  // Si admin connecté → tous les statuts ; sinon seulement publiés
  const showAll = req.headers.authorization && statut === "all";
  let sql = "SELECT id,titre,slug,categorie,resume,auteur,statut,image,tags,vues,createdAt,updatedAt FROM articles WHERE 1=1";
  const p = [];
  if (!showAll) { sql += " AND statut='publie'"; }
  if (categorie) { sql += " AND categorie=?"; p.push(categorie); }
  sql += " ORDER BY createdAt DESC";
  if (limit)  { sql += " LIMIT ?"; p.push(+limit); }
  res.json(await prepare(sql).all(...p));
});

// ── GET /api/articles/admin — tous pour l'admin ───────────────────
router.get("/admin", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  const rows = await prepare("SELECT * FROM articles ORDER BY createdAt DESC").all();
  res.json(rows);
});

// ── GET /api/articles/:id — un article complet ────────────────────
router.get("/:id", async (req, res) => {
  const a = await prepare("SELECT * FROM articles WHERE id=? OR slug=?").get(req.params.id, req.params.id);
  if (!a) return res.status(404).json({ error: "Article introuvable" });
  // Incrémenter vues (public uniquement)
  if (!req.headers.authorization) {
    await prepare("UPDATE articles SET vues=vues+1 WHERE id=?").run(a.id);
  }
  res.json(a);
});

// ── POST /api/articles — créer un article ─────────────────────────
router.post("/", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  const { titre, categorie, resume, contenu, auteur, statut, image, tags } = req.body;
  if (!titre) return res.status(400).json({ error: "Le titre est requis" });
  const r = await prepare(`
    INSERT INTO articles (titre,categorie,resume,contenu,auteur,statut,image,tags)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(
    titre,
    categorie || "Actualités",
    resume   || null,
    contenu  || null,
    auteur   || "ImmobilierCI",
    statut   || "brouillon",
    image    || null,
    tags     || null,
  );
  // Générer le slug avec l'id
  const slug = makeSlug(titre, r.lastInsertRowid);
  await prepare("UPDATE articles SET slug=? WHERE id=?").run(slug, r.lastInsertRowid);
  const created = await prepare("SELECT * FROM articles WHERE id=?").get(r.lastInsertRowid);
  res.status(201).json(created);
});

// ── PUT /api/articles/:id — modifier un article ───────────────────
router.put("/:id", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  const { titre, categorie, resume, contenu, auteur, statut, image, tags } = req.body;
  const a = await prepare("SELECT * FROM articles WHERE id=?").get(+req.params.id);
  if (!a) return res.status(404).json({ error: "Article introuvable" });
  const slug = titre !== a.titre ? makeSlug(titre || a.titre, a.id) : a.slug;
  await prepare(`
    UPDATE articles SET
      titre=?, slug=?, categorie=?, resume=?, contenu=?,
      auteur=?, statut=?, image=?, tags=?,
      updatedAt=datetime('now')
    WHERE id=?
  `).run(
    titre    || a.titre,
    slug,
    categorie|| a.categorie,
    resume   ?? a.resume,
    contenu  ?? a.contenu,
    auteur   || a.auteur,
    statut   || a.statut,
    image    ?? a.image,
    tags     ?? a.tags,
    a.id,
  );
  res.json(await prepare("SELECT * FROM articles WHERE id=?").get(a.id));
});

// ── PUT /api/articles/:id/publier — publier / dépublier ───────────
router.put("/:id/publier", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  const a    = await prepare("SELECT * FROM articles WHERE id=?").get(+req.params.id);
  if (!a) return res.status(404).json({ error: "Article introuvable" });
  const next = a.statut === "publie" ? "brouillon" : "publie";
  await prepare("UPDATE articles SET statut=?,updatedAt=datetime('now') WHERE id=?").run(next, a.id);
  res.json(await prepare("SELECT * FROM articles WHERE id=?").get(a.id));
});

// ── DELETE /api/articles/:id ──────────────────────────────────────
router.delete("/:id", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  await prepare("DELETE FROM articles WHERE id=?").run(+req.params.id);
  res.json({ success: true });
});

module.exports = router;
