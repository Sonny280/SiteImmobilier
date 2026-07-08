// routes/realisations.js
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, requireRole } = require("../middleware/auth");

// GET publiques
router.get("/", (req, res) => {
  const { type } = req.query;
  let sql = "SELECT * FROM realisations WHERE visible=1";
  const p = [];
  if (type) { sql += " AND type=?"; p.push(type); }
  sql += " ORDER BY ordre ASC, annee DESC, id DESC";
  res.json(prepare(sql).all(...p));
});

// GET admin (toutes)
router.get("/admin", auth, requireRole(["superadmin","admin"]), (req, res) => {
  res.json(prepare("SELECT * FROM realisations ORDER BY ordre ASC, id DESC").all());
});

// POST admin — créer
router.post("/", auth, requireRole(["superadmin","admin"]), (req, res) => {
  const { titre, type, description, annee, commune, ville, image, ordre } = req.body;
  if (!titre) return res.status(400).json({ error: "Titre requis" });
  const r = prepare("INSERT INTO realisations (titre,type,description,annee,commune,ville,image,ordre) VALUES (?,?,?,?,?,?,?,?)")
    .run(titre, type || "Gestion locative", description || null, annee || String(new Date().getFullYear()), commune || null, ville || "Abidjan", image || null, ordre || 0);
  res.status(201).json(prepare("SELECT * FROM realisations WHERE id=?").get(r.lastInsertRowid));
});

// PUT admin — modifier
router.put("/:id", auth, requireRole(["superadmin","admin"]), (req, res) => {
  const { titre, type, description, annee, commune, ville, image, ordre, visible } = req.body;
  const r = prepare("SELECT * FROM realisations WHERE id=?").get(+req.params.id);
  if (!r) return res.status(404).json({ error: "Introuvable" });
  prepare("UPDATE realisations SET titre=?,type=?,description=?,annee=?,commune=?,ville=?,image=?,ordre=?,visible=? WHERE id=?")
    .run(titre||r.titre, type||r.type, description??r.description, annee||r.annee, commune??r.commune, ville||r.ville, image??r.image, ordre??r.ordre, visible??r.visible, r.id);
  res.json(prepare("SELECT * FROM realisations WHERE id=?").get(r.id));
});

// DELETE admin
router.delete("/:id", auth, requireRole(["superadmin","admin"]), (req, res) => {
  prepare("DELETE FROM realisations WHERE id=?").run(+req.params.id);
  res.json({ success: true });
});

module.exports = router;
