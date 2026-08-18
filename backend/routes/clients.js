// routes/clients.js — v2 multi-rôles
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, requireModule } = require("../middleware/auth");

// GET /api/clients
router.get("/", auth, async (req, res) => {
  try {
    const rows = await prepare("SELECT * FROM clients ORDER BY created_at DESC").all();
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/clients/:id
router.get("/:id", auth, async (req, res) => {
  try {
    const c = await prepare("SELECT * FROM clients WHERE id=?").get(+req.params.id);
    if (!c) return res.status(404).json({ error: "Client introuvable" });
    res.json(c);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/clients
router.post("/", auth, requireModule("clients"), async (req, res) => {
  try {
    const {
      nom, email, tel, whatsapp, type, roles,
      bienId, dateEntree, dateSortie, caution, loyer,
      profession, employeur, revenus, piece_identite,
      budget, modeFinancement, banque, typeRecherche, notes
    } = req.body;

    if (!nom) return res.status(400).json({ error: "Le nom est requis" });

    // roles = type principal si pas spécifié (ex: "locataire" ou "locataire,acheteur")
    const clientRoles = roles || type || "prospect";
    const clientType  = type || (clientRoles.split(",")[0]);

    const r = await prepare(`
      INSERT INTO clients (
        nom, email, tel, whatsapp, type, roles,
        bien_id, date_entree, date_sortie, caution, loyer,
        profession, employeur, revenus, piece_identite, notes
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      nom, email||null, tel||null, whatsapp||null,
      clientType, clientRoles,
      bienId||null, dateEntree||null, dateSortie||null,
      +caution||0, +loyer||0,
      profession||null, employeur||null, +revenus||null,
      piece_identite||null, notes||null
    );

    // Si locataire avec bien → passer le bien en loue
    if (bienId && clientRoles.includes("locataire")) {
      await prepare("UPDATE biens SET statut='loue' WHERE id=?").run(+bienId);
    }

    const created = await prepare("SELECT * FROM clients WHERE id=?").get(r.lastInsertRowid);
    res.status(201).json(created);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/clients/:id
router.put("/:id", auth, requireModule("clients"), async (req, res) => {
  try {
    const id = +req.params.id;
    const ancien = await prepare("SELECT * FROM clients WHERE id=?").get(id);
    if (!ancien) return res.status(404).json({ error: "Client introuvable" });

    const {
      nom, email, tel, whatsapp, type, roles,
      bienId, dateEntree, dateSortie, caution, loyer,
      profession, employeur, revenus, piece_identite,
      budget, modeFinancement, banque, typeRecherche, notes
    } = req.body;

    const clientRoles = roles || type || ancien.roles || "prospect";
    const clientType  = type || (clientRoles.split(",")[0]);

    await prepare(`
      UPDATE clients SET
        nom=?, email=?, tel=?, whatsapp=?, type=?, roles=?,
        bien_id=?, date_entree=?, date_sortie=?, caution=?, loyer=?,
        profession=?, employeur=?, revenus=?, piece_identite=?, notes=?
      WHERE id=?
    `).run(
      nom, email||null, tel||null, whatsapp||null,
      clientType, clientRoles,
      bienId||null, dateEntree||null, dateSortie||null,
      +caution||0, +loyer||0,
      profession||null, employeur||null, +revenus||null,
      piece_identite||null, notes||null,
      id
    );

    // Si locataire avec bien → passer le bien en loue
    if (bienId && clientRoles.includes("locataire")) {
      await prepare("UPDATE biens SET statut='loue' WHERE id=?").run(+bienId);
    }

    // Si bien retiré → repasser en disponible si plus de locataire
    if (!bienId && ancien.bienId) {
      const autresLoc = await prepare(
        "SELECT COUNT(*) as n FROM clients WHERE bien_id=? AND id!=? AND roles LIKE '%locataire%'"
      ).get(ancien.bienId, id);
      if (!autresLoc?.n) {
        await prepare("UPDATE biens SET statut='disponible' WHERE id=?").run(ancien.bienId);
      }
    }

    const updated = await prepare("SELECT * FROM clients WHERE id=?").get(id);
    res.json(updated);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/clients/:id
router.delete("/:id", auth, requireModule("clients"), async (req, res) => {
  try {
    const id = +req.params.id;
    const c = await prepare("SELECT * FROM clients WHERE id=?").get(id);
    if (!c) return res.status(404).json({ error: "Introuvable" });
    if (c.bienId) return res.status(400).json({ error: "Libérez d'abord le bien avant de supprimer ce client." });
    await prepare("DELETE FROM clients WHERE id=?").run(id);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;