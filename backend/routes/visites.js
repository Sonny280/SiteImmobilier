// routes/visites.js — v3 avec notification WhatsApp
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, requireModule } = require("../middleware/auth");
const { notifNouvelleVisite } = require("../config/whatsapp");

router.get("/", auth, async (req, res) => {
  const rows = await prepare(`
    SELECT v.*, b.titre as bienTitre, c.nom as clientNom
    FROM visites v
    LEFT JOIN biens b ON v.bienId = b.id
    LEFT JOIN clients c ON v.clientId = c.id
    ORDER BY v.date ASC, v.heure ASC
  `).all();
  res.json(rows);
});

router.post("/", auth, requireModule("visites"), async (req, res) => {
  const { bienId, clientId, nom, tel, date, heure, notes } = req.body;
  if (!bienId || !date) return res.status(400).json({ error: "bienId et date requis" });
  const r = await prepare("INSERT INTO visites (bienId,clientId,nom,tel,date,heure,notes,statut) VALUES (?,?,?,?,?,?,?,'planifie')")
    .run(+bienId, clientId||null, nom||null, tel||null, date, heure||null, notes||null);
  const visite = await prepare("SELECT * FROM visites WHERE id=?").get(r.lastInsertRowid);
  const bien   = await prepare("SELECT * FROM biens WHERE id=?").get(+bienId);
  // Notification WhatsApp
  notifNouvelleVisite(visite, bien).catch(e => console.error("WhatsApp visite:", e.message));
  res.status(201).json(visite);
});

router.put("/:id", auth, requireModule("visites"), async (req, res) => {
  const { statut, notes } = req.body;
  await prepare("UPDATE visites SET statut=?,notes=? WHERE id=?").run(statut||"planifie", notes||null, +req.params.id);
  res.json(await prepare("SELECT * FROM visites WHERE id=?").get(+req.params.id));
});

router.delete("/:id", auth, requireModule("visites"), async (req, res) => {
  await prepare("DELETE FROM visites WHERE id=?").run(+req.params.id);
  res.json({ success: true });
});

module.exports = router;
