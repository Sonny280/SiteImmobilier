// routes/loyers.js — v4 avec validations complètes
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, requireModule } = require("../middleware/auth");

async function enrich(l) {
  if (!l) return null;
  let joursRetard = 0;
  if (l.statut !== "paye" && l.echeance) {
    const diff = new Date() - new Date(l.echeance);
    if (diff > 0) joursRetard = Math.floor(diff / 86400000);
  }
  return { ...l, joursRetard, penalite: 0 };
}

const BASE_SQL = `
  SELECT l.*,
    c.nom      as "clientNom",  c.email as "clientEmail",
    c.whatsapp as "clientWa",   c.tel   as "clientTel",
    b.titre    as "bienTitre",  b.ref   as "bienRef"
  FROM loyers l
  LEFT JOIN clients c ON l.client_id = c.id
  LEFT JOIN biens   b ON l.bien_id   = b.id
`;

// GET /api/loyers
router.get("/", auth, async (req, res) => {
  try {
    const { mois, statut, clientId, bienId } = req.query;
    let sql = BASE_SQL + " WHERE l.client_id IS NOT NULL AND l.bien_id IS NOT NULL";
    const p = [];
    if (mois)     { sql += " AND l.mois=?";     p.push(mois); }
    if (statut)   { sql += " AND l.statut=?";   p.push(statut); }
    if (clientId) { sql += " AND l.client_id=?"; p.push(+clientId); }
    if (bienId)   { sql += " AND l.bien_id=?";   p.push(+bienId); }
    sql += " ORDER BY l.mois DESC, l.echeance ASC";
    const rows = await prepare(sql).all(...p);
    res.json(await Promise.all(rows.map(enrich)));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/loyers/retards
router.get("/retards", auth, async (_, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const rows = await prepare(BASE_SQL + 
      " WHERE l.statut IN ('impaye','en_attente') AND l.echeance < ? AND l.client_id IS NOT NULL ORDER BY l.echeance ASC"
    ).all(today);
    res.json(await Promise.all(rows.map(enrich)));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/loyers — créer un loyer manuel
router.post("/", auth, requireModule("loyers"), async (req, res) => {
  try {
    const { clientId, bienId, montant, mois, echeance, notes } = req.body;
    if (!clientId || !bienId || !montant || !mois)
      return res.status(400).json({ error: "clientId, bienId, montant et mois requis" });

    // Vérifier que le client existe et a ce bien
    const client = await prepare("SELECT * FROM clients WHERE id=?").get(+clientId);
    if (!client) return res.status(404).json({ error: "Client introuvable" });

    // Bloquer doublon même client même mois
    const exist = await prepare(
      "SELECT id FROM loyers WHERE clientId=? AND mois=? AND statut != 'annule'"
    ).get(+clientId, mois);
    if (exist) return res.status(409).json({ 
      error: `Un loyer existe déjà pour ce client en ${mois}. Utilisez le paiement par tranche si nécessaire.` 
    });

    const r = await prepare(
      "INSERT INTO loyers(clientId,bienId,montant,mois,echeance,statut,notes) VALUES(?,?,?,?,?,?,?)"
    ).run(+clientId, +bienId, +montant, mois, echeance||null, "en_attente", notes||null);

    const loyer = await prepare(BASE_SQL + " WHERE l.id=?").get(r.lastInsertRowid);
    res.status(201).json(await enrich(loyer));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/loyers/generer-mois — générer loyers du mois pour tous les locataires
router.post("/generer-mois", auth, requireModule("loyers"), async (req, res) => {
  try {
    const { mois } = req.body;
    if (!mois) return res.status(400).json({ error: "mois requis (format YYYY-MM)" });

    // Récupérer tous les locataires actifs avec bien associé
    const locataires = await prepare(
      "SELECT * FROM clients WHERE type='locataire' AND bienId IS NOT NULL AND loyer > 0"
    ).all();

    let crees = 0;
    let ignores = 0;
    for (const c of locataires) {
      // Vérifier doublon
      const exist = await prepare(
        "SELECT id FROM loyers WHERE clientId=? AND mois=?"
      ).get(c.id, mois);
      if (exist) { ignores++; continue; }

      // Calculer échéance (le 5 du mois)
      const [y, m] = mois.split("-");
      const echeance = `${y}-${m}-05`;

      await prepare(
        "INSERT INTO loyers(clientId,bienId,montant,mois,echeance,statut) VALUES(?,?,?,?,?,'en_attente')"
      ).run(c.id, c.bienId, c.loyer, mois, echeance);
      crees++;
    }
    res.json({ crees, ignores, message: `${crees} loyer(s) créé(s), ${ignores} ignoré(s) (déjà existants)` });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/loyers/:id/payer — marquer payé (paiement complet ou tranche)
router.put("/:id/payer", auth, requireModule("loyers"), async (req, res) => {
  try {
    const id = +req.params.id;
    const { modePaiement, montantRecu, tranche } = req.body;
    const loyer = await prepare("SELECT * FROM loyers WHERE id=?").get(id);
    if (!loyer) return res.status(404).json({ error: "Loyer introuvable" });

    const mr = +montantRecu || loyer.montant;
    if (mr <= 0) return res.status(400).json({ error: "Le montant reçu doit être supérieur à 0." });

    // Calculer total déjà reçu
    const dejaRecu = loyer.montantRecu || 0;
    const totalRecu = dejaRecu + mr;

    if (totalRecu > loyer.montant * 1.01) {
      return res.status(400).json({ 
        error: `Dépassement : vous essayez d'encaisser ${totalRecu.toLocaleString("fr-CI")} FCFA pour un loyer de ${loyer.montant.toLocaleString("fr-CI")} FCFA.` 
      });
    }

    const today = new Date().toISOString().split("T")[0];
    // Si paiement par tranche et pas encore complet
    const nouveauStatut = totalRecu >= loyer.montant ? "paye" : "partiel";

    await prepare(
      "UPDATE loyers SET statut=?,datePaiement=?,montantRecu=?,modePaiement=?,joursRetard=0 WHERE id=?"
    ).run(nouveauStatut, today, totalRecu, modePaiement||"virement", id);

    const updated = await prepare(BASE_SQL + " WHERE l.id=?").get(id);
    res.json(await enrich(updated));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/loyers/:id — modifier un loyer
router.put("/:id", auth, requireModule("loyers"), async (req, res) => {
  try {
    const id = +req.params.id;
    const { statut, datePaiement, montantRecu, modePaiement, notes, montant } = req.body;
    const loyer = await prepare("SELECT * FROM loyers WHERE id=?").get(id);
    if (!loyer) return res.status(404).json({ error: "Introuvable" });

    await prepare(
      "UPDATE loyers SET statut=COALESCE(?,statut),datePaiement=?,montantRecu=?,modePaiement=?,notes=?,montant=COALESCE(?,montant) WHERE id=?"
    ).run(statut||null, datePaiement||null, montantRecu||null, modePaiement||"virement", notes||null, montant||null, id);

    const updated = await prepare(BASE_SQL + " WHERE l.id=?").get(id);
    res.json(await enrich(updated));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/loyers/:id
router.delete("/:id", auth, requireModule("loyers"), async (req, res) => {
  try {
    const loyer = await prepare("SELECT * FROM loyers WHERE id=?").get(+req.params.id);
    if (!loyer) return res.status(404).json({ error: "Introuvable" });
    if (loyer.statut === "paye") 
      return res.status(400).json({ error: "Impossible de supprimer un loyer payé." });
    await prepare("DELETE FROM loyers WHERE id=?").run(+req.params.id);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/loyers/:id/relancer
router.post("/:id/relancer", auth, requireModule("loyers"), async (req, res) => {
  try {
    const { canal } = req.body;
    const loyer = await prepare(BASE_SQL + " WHERE l.id=?").get(+req.params.id);
    if (!loyer) return res.status(404).json({ error: "Introuvable" });
    await prepare(
      "INSERT INTO relances(loyerId,clientId,type,canal,date) VALUES(?,?,?,?,?)"
    ).run(loyer.id, loyer.clientId, "amiable", canal||"whatsapp", new Date().toISOString().split("T")[0]);
    res.json({ success: true, message: `Relance ${canal||"whatsapp"} enregistrée` });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE loyers orphelins (sans client ni bien)
router.delete("/purge/orphelins", auth, async (req, res) => {
  try {
    if (req.user?.role !== "superadmin") return res.status(403).json({ error: "Accès refusé" });
    const r = await prepare("DELETE FROM loyers WHERE clientId IS NULL OR bienId IS NULL").run();
    res.json({ deleted: r.changes, message: `${r.changes} loyer(s) orphelin(s) supprimé(s)` });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
