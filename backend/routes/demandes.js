// routes/demandes.js — v3 avec notification WhatsApp
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, contactLimiter, requireModule } = require("../middleware/auth");
const { sendNotifAgence, sendConfirmationVisiteur } = require("../config/email");
const { notifNouvellesDemande } = require("../config/whatsapp");

// GET /api/demandes
router.get("/", auth, async (req, res) => {
  const { statut } = req.query;
  let sql = "SELECT d.*, b.titre as bienTitre FROM demandes d LEFT JOIN biens b ON d.bienId=b.id WHERE 1=1";
  const p = [];
  if (statut && statut !== "all") { sql += " AND d.statut=?"; p.push(statut); }
  sql += " ORDER BY d.createdAt DESC";
  res.json(await prepare(sql).all(...p));
});

// POST /api/demandes — formulaire public
router.post("/", contactLimiter, async (req, res) => {
  const { nom, email, tel, interet, budget, message, bienId } = req.body;
  if (!nom || !tel) return res.status(400).json({ error: "Nom et téléphone requis" });
  const r = await prepare("INSERT INTO demandes (nom,email,tel,interet,budget,message,bienId,statut,source) VALUES (?,?,?,?,?,?,?,'nouveau','formulaire')")
    .run(nom, email||null, tel, interet||"location", budget||null, message||null, bienId||null);
  const demande = await prepare("SELECT * FROM demandes WHERE id=?").get(r.lastInsertRowid);
  const bien    = bienId ? await prepare("SELECT * FROM biens WHERE id=?").get(+bienId) : null;

  // Notifications en parallèle (email + WhatsApp)
  Promise.all([
    sendNotifAgence(demande, bien).catch(e => console.error("Email agence:", e.message)),
    sendConfirmationVisiteur(demande).catch(e => console.error("Email visiteur:", e.message)),
    notifNouvellesDemande(demande, bien).catch(e => console.error("WhatsApp:", e.message)),
  ]);

  res.status(201).json(demande);
});

// PUT /api/demandes/:id/statut
router.put("/:id/statut", auth, requireModule("demandes"), async (req, res) => {
  const { statut } = req.body;
  await prepare("UPDATE demandes SET statut=? WHERE id=?").run(statut, +req.params.id);
  res.json(await prepare("SELECT * FROM demandes WHERE id=?").get(+req.params.id));
});

// DELETE /api/demandes/:id
router.delete("/:id", auth, requireModule("demandes"), async (req, res) => {
  await prepare("DELETE FROM demandes WHERE id=?").run(+req.params.id);
  res.json({ success: true });
});

module.exports = router;
