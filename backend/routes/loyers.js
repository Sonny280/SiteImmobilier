// routes/loyers.js — v3 SANS pénalités, avec retards simples + notif WhatsApp
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, requireModule } = require("../middleware/auth");
const { notifLoyerPaye } = require("../config/whatsapp");
const { sendQuittance, sendRelanceLoyer } = require("../config/email");

// Calcul retard SANS pénalité
function enrich(l) {
  if (!l) return null;
  let joursRetard = 0;
  if (l.statut !== "paye" && l.echeance) {
    const diff = new Date() - new Date(l.echeance);
    if (diff > 0) joursRetard = Math.floor(diff / 86400000);
  }
  // Pas de pénalité — supprimé à la demande
  return { ...l, joursRetard, penalite: 0 };
}

const BASE_SQL = `
  SELECT l.*,
    c.nom    as clientNom,  c.email as clientEmail,
    c.whatsapp as clientWa, c.tel   as clientTel,
    b.titre  as bienTitre,  b.ref   as bienRef
  FROM loyers l
  LEFT JOIN clients c ON l.clientId = c.id
  LEFT JOIN biens   b ON l.bienId   = b.id
`;

// GET /api/loyers
router.get("/", auth, (req, res) => {
  const { mois, statut, clientId, bienId } = req.query;
  let sql = BASE_SQL + " WHERE 1=1";
  const p = [];
  if (mois)     { sql += " AND l.mois=?";     p.push(mois); }
  if (statut)   { sql += " AND l.statut=?";   p.push(statut); }
  if (clientId) { sql += " AND l.clientId=?"; p.push(+clientId); }
  if (bienId)   { sql += " AND l.bienId=?";   p.push(+bienId); }
  sql += " ORDER BY l.mois DESC, l.echeance ASC";
  res.json(prepare(sql).all(...p).map(enrich));
});

// GET /api/loyers/retards — loyers en retard
router.get("/retards", auth, (_, res) => {
  const today = new Date().toISOString().split("T")[0];
  res.json(prepare(BASE_SQL + " WHERE l.statut IN ('impaye','en_attente') AND l.echeance < ? ORDER BY l.echeance ASC").all(today).map(enrich));
});

// GET /api/loyers/stats — statistiques globales
router.get("/stats", auth, (_, res) => {
  const mois  = new Date().toISOString().slice(0,7);
  const today = new Date().toISOString().split("T")[0];
  res.json({
    totalMois:   prepare("SELECT SUM(montant) as s FROM loyers WHERE mois=?").get(mois)?.s||0,
    payeMois:    prepare("SELECT SUM(montant) as s FROM loyers WHERE mois=? AND statut='paye'").get(mois)?.s||0,
    nbRetards:   prepare("SELECT COUNT(*) as c FROM loyers WHERE statut IN ('impaye','en_attente') AND echeance < ?").get(today).c,
    nbImpaye:    prepare("SELECT COUNT(*) as c FROM loyers WHERE statut='impaye'").get().c,
    montRetards: prepare("SELECT SUM(montant) as s FROM loyers WHERE statut IN ('impaye','en_attente') AND echeance < ?").get(today)?.s||0,
  });
});

// POST /api/loyers
router.post("/", auth, requireModule("loyers"), (req, res) => {
  const { clientId, bienId, montant, mois, echeance, statut, modePaiement, notes } = req.body;
  if (!clientId||!bienId||!montant||!mois)
    return res.status(400).json({ error: "clientId, bienId, montant, mois requis" });
  const r = prepare(`
    INSERT INTO loyers (clientId,bienId,montant,mois,echeance,statut,modePaiement,notes)
    VALUES (?,?,?,?,?,?,?,?)
  `).run(+clientId, +bienId, +montant, mois, echeance||null, statut||"en_attente", modePaiement||"virement", notes||null);
  res.status(201).json(enrich(prepare("SELECT * FROM loyers WHERE id=?").get(r.lastInsertRowid)));
});

// PUT /api/loyers/:id/payer — marquer payé + envoyer quittance
router.put("/:id/payer", auth, requireModule("loyers"), async (req, res) => {
  const id = +req.params.id;
  const { modePaiement, montantRecu } = req.body;
  const loyer = prepare("SELECT * FROM loyers WHERE id=?").get(id);
  if (!loyer) return res.status(404).json({ error: "Loyer introuvable" });
  const today = new Date().toISOString().split("T")[0];
  prepare("UPDATE loyers SET statut='paye',datePaiement=?,montantRecu=?,modePaiement=?,joursRetard=?,penalite=0 WHERE id=?")
    .run(today, +montantRecu||loyer.montant, modePaiement||"virement", enrich(loyer).joursRetard, id);
  const updated = prepare("SELECT * FROM loyers WHERE id=?").get(id);
  const client  = prepare("SELECT * FROM clients WHERE id=?").get(loyer.clientId);
  const bien    = prepare("SELECT * FROM biens WHERE id=?").get(loyer.bienId);
  sendQuittance(updated, client, bien).catch(console.error);
  notifLoyerPaye(updated, client, bien).catch(console.error);
  res.json(enrich(updated));
});

// PUT /api/loyers/:id — modification générale (notes, statut impayé/en_attente).
// Pour marquer un loyer comme PAYÉ, utilisez exclusivement PUT /:id/payer —
// cette route déclenche l'envoi de la quittance et la notification WhatsApp.
// On bloque ici toute tentative de passer statut="paye" par ce raccourci pour
// éviter qu'un loyer soit marqué payé sans qu'aucune notification ne parte.
router.put("/:id", auth, requireModule("loyers"), (req, res) => {
  const id = +req.params.id;
  const { statut, datePaiement, montantRecu, modePaiement, notes } = req.body;
  if (statut === "paye") {
    return res.status(400).json({ error: "Utilisez la route de paiement dédiée (PUT /:id/payer) pour marquer un loyer comme payé." });
  }
  const STATUTS_VALIDES = ["en_attente","impaye"];
  if (statut && !STATUTS_VALIDES.includes(statut)) return res.status(400).json({ error: "Statut invalide" });
  prepare("UPDATE loyers SET statut=COALESCE(?,statut),datePaiement=?,montantRecu=?,modePaiement=?,notes=? WHERE id=?")
    .run(statut||null, datePaiement||null, montantRecu||null, modePaiement||"virement", notes||null, id);
  res.json(enrich(prepare("SELECT * FROM loyers WHERE id=?").get(id)));
});

// POST /api/loyers/:id/relancer — relance WhatsApp ou email (sans pénalité)
router.post("/:id/relancer", auth, requireModule("loyers"), async (req, res) => {
  const { canal = "whatsapp" } = req.body;
  const loyer  = prepare("SELECT * FROM loyers WHERE id=?").get(+req.params.id);
  if (!loyer) return res.status(404).json({ error: "Loyer introuvable" });
  const client = prepare("SELECT * FROM clients WHERE id=?").get(loyer.clientId);
  const bien   = prepare("SELECT * FROM biens WHERE id=?").get(loyer.bienId);
  const enriched = enrich(loyer);
  // Historique relance
  prepare("INSERT INTO relances (loyerId,clientId,type,canal,date) VALUES (?,?,?,?,?)")
    .run(loyer.id, loyer.clientId, "amiable", canal, new Date().toISOString().split("T")[0]);
  const numRelances = prepare("SELECT COUNT(*) as c FROM relances WHERE loyerId=?").get(loyer.id).c;
  if (canal === "email") sendRelanceLoyer(enriched, client, bien, numRelances).catch(console.error);
  const moisFmt = new Date((loyer.mois||"2025-01")+"-01").toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
  const msg = encodeURIComponent(
    `Bonjour ${client?.nom||""},\n\nNous vous rappelons que votre loyer du mois de ${moisFmt} d'un montant de ${new Intl.NumberFormat("fr-CI").format(loyer.montant)} FCFA est en attente de règlement.\n\nMerci de régulariser votre situation au plus tôt.\n\nCordialement,\nImmobilierCI`
  );
  const waUrl = `https://wa.me/${(client?.whatsapp||client?.tel||"").replace(/\D/g,"")}?text=${msg}`;
  res.json({ success:true, numRelances, waUrl, canal });
});

// DELETE /api/loyers/:id
router.delete("/:id", auth, requireModule("loyers"), (req, res) => {
  prepare("DELETE FROM loyers WHERE id=?").run(+req.params.id);
  res.json({ success: true });
});

// POST /api/loyers/generer-mois — génère les loyers d'un mois pour tous les locataires
router.post("/generer-mois", auth, requireModule("loyers"), (req, res) => {
  const { mois } = req.body;
  if (!mois) return res.status(400).json({ error: "mois requis (YYYY-MM)" });
  const locataires = prepare("SELECT * FROM clients WHERE type='locataire' AND bienId IS NOT NULL AND loyer > 0").all();
  let crees = 0, ignores = 0;
  locataires.forEach(c => {
    const existe = prepare("SELECT id FROM loyers WHERE clientId=? AND mois=?").get(c.id, mois);
    if (!existe) {
      const [y,m] = mois.split("-");
      prepare("INSERT INTO loyers (clientId,bienId,montant,mois,echeance,statut) VALUES (?,?,?,?,?,'en_attente')")
        .run(c.id, c.bienId, c.loyer, mois, `${y}-${m}-01`);
      crees++;
    } else { ignores++; }
  });
  res.json({ success:true, crees, ignores, total:locataires.length });
});

module.exports = router;
