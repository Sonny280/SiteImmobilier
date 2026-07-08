// routes/documents.js — pièces jointes (base64)
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, requireModule } = require("../middleware/auth");

// Liste blanche stricte des types de documents acceptés. Tout type hors de
// cette liste est refusé — empêche l'upload de HTML/JS/exécutables qui
// pourraient être servis au téléchargement et exécutés dans le navigateur
// (XSS stocké) ou, sur certains hébergements, interprétés côté serveur.
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg", "image/jpg", "image/png", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

// Modules métiers vers lesquels un document peut être attaché. Limite la
// portée de "entite" à des valeurs connues plutôt que d'accepter n'importe
// quelle chaîne arbitraire dans une colonne utilisée pour des jointures.
const ALLOWED_ENTITES = new Set(["bien","client","vente","contrat","loyer"]);

// GET /api/documents?entite=client&entiteId=1
router.get("/", auth, (req, res) => {
  const { entite, entiteId } = req.query;
  if (!entite || !entiteId) return res.status(400).json({ error: "entite et entiteId requis" });
  if (!ALLOWED_ENTITES.has(entite)) return res.status(400).json({ error: "Type d'entité invalide" });
  if (!Number.isInteger(+entiteId)) return res.status(400).json({ error: "entiteId invalide" });
  res.json(prepare("SELECT id,nom,type,entite,entiteId,taille,mimeType,notes,createdAt FROM documents WHERE entite=? AND entiteId=? ORDER BY createdAt DESC").all(entite, +entiteId));
});

// POST /api/documents — upload base64 (toute écriture nécessite une permission
// métier sur le module concerné — un rôle "lecture" ne peut rien uploader).
router.post("/", auth, requireModule("documents"), (req, res) => {
  const { nom, type, entite, entiteId, fichier, taille, mimeType, notes } = req.body;
  if (!nom || !entite || !entiteId || !fichier) return res.status(400).json({ error: "nom, entite, entiteId, fichier requis" });
  if (!ALLOWED_ENTITES.has(entite)) return res.status(400).json({ error: "Type d'entité invalide" });
  if (!Number.isInteger(+entiteId)) return res.status(400).json({ error: "entiteId invalide" });
  if (!ALLOWED_MIME.has(mimeType)) return res.status(400).json({ error: "Type de fichier non autorisé. Formats acceptés : PDF, JPG, PNG, WEBP, DOC, DOCX." });
  // Nom de fichier nettoyé pour l'en-tête Content-Disposition au téléchargement —
  // évite l'injection de caractères de contrôle/guillemets dans l'en-tête HTTP.
  const safeNom = String(nom).replace(/[\r\n"]/g, "_").slice(0, 200);
  const sizeBytes = Buffer.byteLength(fichier, "base64");
  if (sizeBytes > MAX_SIZE) return res.status(400).json({ error: "Fichier trop volumineux (max 10 Mo)" });
  const r = prepare("INSERT INTO documents (nom,type,entite,entiteId,fichier,taille,mimeType,notes) VALUES (?,?,?,?,?,?,?,?)")
    .run(safeNom, type||"autre", entite, +entiteId, fichier, taille||sizeBytes, mimeType, notes||null);
  res.status(201).json(prepare("SELECT id,nom,type,entite,entiteId,taille,mimeType,notes,createdAt FROM documents WHERE id=?").get(r.lastInsertRowid));
});

// GET /api/documents/:id/download — télécharger
router.get("/:id/download", auth, (req, res) => {
  const doc = prepare("SELECT * FROM documents WHERE id=?").get(+req.params.id);
  if (!doc) return res.status(404).json({ error: "Document introuvable" });
  const buffer = Buffer.from(doc.fichier, "base64");
  // Le Content-Type est revalidé contre la même liste blanche au moment du
  // téléchargement (et non simplement réutilisé depuis la base) — empêche
  // qu'une donnée corrompue ou modifiée directement en base ne fasse servir
  // un type dangereux (ex: text/html) au navigateur.
  const safeMime = ALLOWED_MIME.has(doc.mimeType) ? doc.mimeType : "application/octet-stream";
  res.setHeader("Content-Type", safeMime);
  // X-Content-Type-Options est déjà posé globalement dans server.js, mais on
  // le répète ici pour cette route sensible afin qu'un changement global
  // futur ne réintroduise pas silencieusement le risque de sniffing.
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(doc.nom)}"`);
  res.send(buffer);
});

// DELETE /api/documents/:id
router.delete("/:id", auth, requireModule("documents"), (req, res) => {
  const doc = prepare("SELECT id FROM documents WHERE id=?").get(+req.params.id);
  if (!doc) return res.status(404).json({ error: "Document introuvable" });
  prepare("DELETE FROM documents WHERE id=?").run(+req.params.id);
  res.json({ success: true });
});

module.exports = router;
