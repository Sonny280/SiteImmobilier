// routes/temoignages.js
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, contactLimiter, requireRole } = require("../middleware/auth");

// GET publics (publiés seulement)
router.get("/", async (req, res) => {
  const rows = await prepare("SELECT * FROM temoignages WHERE statut='publie' ORDER BY createdAt DESC").all();
  res.json(rows);
});

// GET admin (tous)
router.get("/admin", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  const rows = await prepare("SELECT * FROM temoignages ORDER BY createdAt DESC").all();
  res.json(rows);
});

// POST public — dépôt par un client
router.post("/", contactLimiter, async (req, res) => {
  const { nom, profession, note, texte } = req.body;
  if (!nom || !texte) return res.status(400).json({ error: "Nom et témoignage requis" });
  const r = await prepare("INSERT INTO temoignages (nom,profession,note,texte,statut) VALUES (?,?,?,?,'en_attente')")
    .run(nom, profession || null, Math.min(5, Math.max(1, +note || 5)), texte);
  res.status(201).json(await prepare("SELECT * FROM temoignages WHERE id=?").get(r.lastInsertRowid));
});

// PUT admin — changer statut
router.put("/:id/statut", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  const { statut } = req.body;
  const STATUTS_VALIDES = ["en_attente","publie","refuse"];
  if (!STATUTS_VALIDES.includes(statut)) return res.status(400).json({ error: "Statut invalide" });
  await prepare("UPDATE temoignages SET statut=? WHERE id=?").run(statut, +req.params.id);
  res.json(await prepare("SELECT * FROM temoignages WHERE id=?").get(+req.params.id));
});

// DELETE admin
router.delete("/:id", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  await prepare("DELETE FROM temoignages WHERE id=?").run(+req.params.id);
  res.json({ success: true });
});

module.exports = router;
