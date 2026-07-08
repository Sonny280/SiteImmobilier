// routes/contrats.js — 2 types : bail (location) et vente
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, requireModule } = require("../middleware/auth");

// GET /api/contrats — avec alertes expirant bientôt (uniquement pour les baux,
// un contrat de vente n'a pas de notion d'échéance/renouvellement).
router.get("/", auth, async (_, res) => {
  const today = new Date().toISOString().split("T")[0];
  const rows = await prepare(`
    SELECT c.*, cl.nom as clientNom, cl.tel as clientTel, cl.whatsapp as clientWa,
           b.titre as bienTitre, b.ref as bienRef
    FROM contrats c
    LEFT JOIN clients cl ON c.clientId = cl.id
    LEFT JOIN biens b    ON c.bienId   = b.id
    ORDER BY c.createdAt DESC
  `).all();
  const enriched = rows.map(c => {
    if (c.type !== "bail" || !c.dateFin) {
      // Vente, ou bail à durée indéterminée sans date de fin : pas d'alerte d'expiration.
      return { ...c, jRestants: null, expirationProche: false, expire: false };
    }
    const jRestants = Math.ceil((new Date(c.dateFin)-new Date(today))/86400000);
    return { ...c, jRestants, expirationProche: jRestants <= 60 && jRestants > 0, expire: jRestants <= 0 };
  });
  res.json(enriched);
});

// POST /api/contrats
router.post("/", auth, requireModule("contrats"), async (req, res) => {
  const {
    type, clientId, bienId,
    dateDebut, dateFin, loyer, caution, indexation, garantie,
    dateSignature, prixVente, notaire, titreVerifie,
    notes
  } = req.body;
  const t = type === "vente" ? "vente" : "bail";

  if (!clientId || !bienId) return res.status(400).json({ error: "clientId et bienId requis" });

  if (t === "bail") {
    if (!dateDebut) return res.status(400).json({ error: "Date de début requise pour un bail." });
    if (!loyer || +loyer <= 0) return res.status(400).json({ error: "Le loyer doit être supérieur à 0." });
    // dateFin reste optionnelle — un bail peut être à durée indéterminée reconductible.
  } else {
    if (!dateSignature) return res.status(400).json({ error: "Date de signature requise pour un contrat de vente." });
    if (!prixVente || +prixVente <= 0) return res.status(400).json({ error: "Le prix de vente doit être supérieur à 0." });
  }

  const count = await prepare("SELECT COUNT(*) as c FROM contrats").get().c;
  const ref   = t === "bail"
    ? `BAI-${new Date().getFullYear()}-${String(count+1).padStart(3,"0")}`
    : `CTV-${new Date().getFullYear()}-${String(count+1).padStart(3,"0")}`;

  const r = await prepare(`
    INSERT INTO contrats
      (ref,type,clientId,bienId,dateDebut,dateFin,loyer,caution,indexation,garantie,
       dateSignature,prixVente,notaire,titreVerifie,notes,statut)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'actif')
  `).run(
    ref, t, +clientId, +bienId,
    dateDebut||null, dateFin||null, +loyer||0, +caution||0, indexation||null, garantie||null,
    dateSignature||null, +prixVente||null, notaire||null, titreVerifie?1:0,
    notes||null,
  );

  // Un contrat de bail signé met le bien en "loué". Un contrat de vente ne
  // touche pas au statut du bien — c'est le module Ventes qui gère le cycle
  // prospect → ... → finalisée → "vendu" (cf. routes/ventes.js).
  if (t === "bail") {
    await prepare("UPDATE biens SET statut='loue' WHERE id=?").run(+bienId);
  }

  res.status(201).json(await prepare("SELECT * FROM contrats WHERE id=?").get(r.lastInsertRowid));
});

// PUT /api/contrats/:id — renouvellement ou modification
router.put("/:id", auth, requireModule("contrats"), async (req, res) => {
  const id = +req.params.id;
  const curr = await prepare("SELECT * FROM contrats WHERE id=?").get(id);
  if (!curr) return res.status(404).json({ error: "Contrat introuvable" });

  const { statut, dateFin, loyer, dateSignature, prixVente, notaire, titreVerifie, notes } = req.body;
  if (loyer !== undefined && +loyer < 0) return res.status(400).json({ error: "Le loyer ne peut pas être négatif." });
  if (prixVente !== undefined && +prixVente < 0) return res.status(400).json({ error: "Le prix de vente ne peut pas être négatif." });

  await prepare(`
    UPDATE contrats SET
      statut=?, dateFin=?, loyer=?, dateSignature=?, prixVente=?, notaire=?, titreVerifie=?, notes=?
    WHERE id=?
  `).run(
    statut||curr.statut,
    dateFin!==undefined?dateFin:curr.dateFin,
    loyer!==undefined?+loyer:curr.loyer,
    dateSignature!==undefined?dateSignature:curr.dateSignature,
    prixVente!==undefined?+prixVente:curr.prixVente,
    notaire!==undefined?notaire:curr.notaire,
    titreVerifie!==undefined?(titreVerifie?1:0):curr.titreVerifie,
    notes!==undefined?notes:curr.notes,
    id
  );
  res.json(await prepare("SELECT * FROM contrats WHERE id=?").get(id));
});

// DELETE /api/contrats/:id
router.delete("/:id", auth, requireModule("contrats"), async (req, res) => {
  const c = await prepare("SELECT * FROM contrats WHERE id=?").get(+req.params.id);
  if (!c) return res.status(404).json({ error: "Introuvable" });
  // Si on supprime un bail actif, le bien redevient disponible (sauf s'il a
  // d'autres locataires actifs ou une vente en cours — même logique que la
  // suppression d'un client dans routes/clients.js).
  if (c.type === "bail" && c.statut === "actif") {
    const autres = await prepare("SELECT COUNT(*) as n FROM clients WHERE bienId=? AND type='locataire'").get(c.bienId).n;
    if (autres === 0) {
      const bien = await prepare("SELECT statut FROM biens WHERE id=?").get(c.bienId);
      if (bien && !["en_cours","vendu"].includes(bien.statut)) {
        await prepare("UPDATE biens SET statut='disponible' WHERE id=?").run(c.bienId);
      }
    }
  }
  await prepare("DELETE FROM contrats WHERE id=?").run(c.id);
  res.json({ success: true });
});

module.exports = router;
