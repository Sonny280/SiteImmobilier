// routes/clients.js — avec mise à jour statut bien automatique
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, requireModule } = require("../middleware/auth");

// Mise à jour statut bien selon attribution/retrait locataire
async function syncBienStatut(ancienBienId, nouveauBienId) {
  // L'ancien bien redevient disponible si plus aucun locataire actif
  if (ancienBienId && ancienBienId !== nouveauBienId) {
    const autresLocataires = await prepare(
      "SELECT COUNT(*) as n FROM clients WHERE bienId=? AND type='locataire'"
    ).get(ancienBienId);
    if (autresLocataires.n === 0) {
      // Ne remettre disponible que si pas en vente
      const bien = await prepare("SELECT statut FROM biens WHERE id=?").get(ancienBienId);
      if (bien && !["en_cours","vendu"].includes(bien.statut)) {
        await prepare("UPDATE biens SET statut='disponible' WHERE id=?").run(ancienBienId);
      }
    }
  }
  // Le nouveau bien passe en "loue"
  if (nouveauBienId) {
    const bien = await prepare("SELECT statut FROM biens WHERE id=?").get(nouveauBienId);
    if (bien && !["en_cours","vendu"].includes(bien.statut)) {
      await prepare("UPDATE biens SET statut='loue' WHERE id=?").run(nouveauBienId);
    }
  }
}

// GET /api/clients
router.get("/", auth, async (_, res) => {
  res.json(await prepare(`
    SELECT c.*, b.titre as bienTitre
    FROM clients c
    LEFT JOIN biens b ON c.bienId = b.id
    ORDER BY c.createdAt DESC
  `).all());
});

// GET /api/clients/:id — avec historique loyers
router.get("/:id", auth, async (req, res) => {
  const client = await prepare("SELECT * FROM clients WHERE id=?").get(+req.params.id);
  if (!client) return res.status(404).json({ error: "Client introuvable" });
  const loyers = await prepare(`
    SELECT l.*, b.titre as bienTitre
    FROM loyers l LEFT JOIN biens b ON l.bienId=b.id
    WHERE l.clientId=? ORDER BY l.mois DESC
  `).all(+req.params.id);
  res.json({
    ...client,
    loyers,
    totalPaye:   loyers.filter(l=>l.statut==="paye").reduce((s,l)=>s+l.montant,0),
    totalImpaye: loyers.filter(l=>l.statut!=="paye").reduce((s,l)=>s+l.montant,0),
  });
});

// POST /api/clients — créer + mettre à jour statut bien
router.post("/", auth, requireModule("clients"), async (req, res) => {
  const { nom,email,tel,whatsapp,type,bienId,dateEntree,dateSortie,caution,loyer,profession,employeur,revenus,piece_identite,notes } = req.body;
  if (!nom) return res.status(400).json({ error: "Nom requis" });
  const r = await prepare(`
    INSERT INTO clients (nom,email,tel,whatsapp,type,bienId,dateEntree,dateSortie,caution,loyer,profession,employeur,revenus,piece_identite,notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(nom, email||null, tel||null, whatsapp||null, type||"locataire", bienId||null, dateEntree||null, dateSortie||null, +caution||0, +loyer||0, profession||null, employeur||null, +revenus||null, piece_identite||null, notes||null);
  // Si locataire avec bien → passer le bien en "loué"
  if ((type||"locataire")==="locataire" && bienId) {
    syncBienStatut(null, +bienId);
  }
  res.status(201).json(await prepare("SELECT * FROM clients WHERE id=?").get(r.lastInsertRowid));
});

// PUT /api/clients/:id — modifier + sync statut bien
router.put("/:id", auth, requireModule("clients"), async (req, res) => {
  const id = +req.params.id;
  const ancien = await prepare("SELECT * FROM clients WHERE id=?").get(id);
  if (!ancien) return res.status(404).json({ error: "Client introuvable" });

  const { nom,email,tel,whatsapp,type,bienId,dateEntree,dateSortie,caution,loyer,profession,employeur,revenus,piece_identite,notes } = req.body;

  await prepare(`
    UPDATE clients SET nom=?,email=?,tel=?,whatsapp=?,type=?,bienId=?,dateEntree=?,dateSortie=?,caution=?,loyer=?,profession=?,employeur=?,revenus=?,piece_identite=?,notes=?
    WHERE id=?
  `).run(nom, email||null, tel||null, whatsapp||null, type||"locataire", bienId||null, dateEntree||null, dateSortie||null, +caution||0, +loyer||0, profession||null, employeur||null, +revenus||null, piece_identite||null, notes||null, id);

  // Sync statut bien si locataire
  if ((type||"locataire")==="locataire") {
    const ancienBienId = ancien.bienId ? +ancien.bienId : null;
    const nouveauBienId = bienId ? +bienId : null;
    if (ancienBienId !== nouveauBienId) {
      syncBienStatut(ancienBienId, nouveauBienId);
    }
  }
  res.json(await prepare("SELECT * FROM clients WHERE id=?").get(id));
});

// DELETE /api/clients/:id — libérer le bien
router.delete("/:id", auth, requireModule("clients"), async (req, res) => {
  const client = await prepare("SELECT * FROM clients WHERE id=?").get(+req.params.id);
  if (client?.bienId && client.type==="locataire") {
    syncBienStatut(+client.bienId, null);
  }
  await prepare("DELETE FROM clients WHERE id=?").run(+req.params.id);
  res.json({ success: true });
});

module.exports = router;
