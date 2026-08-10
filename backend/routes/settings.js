// routes/settings.js — paramètres agence (logo, photos équipe)
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, requireRole } = require("../middleware/auth");
const { uploadBase64 } = require("../config/upload");

// GET /api/settings — lecture publique (logo affiché sur le site)
router.get("/", async (req, res) => {
  try {
    const rows = await prepare("SELECT key, value FROM settings").all();
    const result = {};
    (rows || []).forEach(r => { result[r.key] = r.value; });
    res.json(result);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/settings/upload — upload image vers Cloudinary et sauvegarde URL
router.post("/upload", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  try {
    const { key, image, type } = req.body;
    if (!key || !image) return res.status(400).json({ error: "key et image requis" });

    const ALLOWED_KEYS = ["logo", "team_dg", "team_comm", "team_gestion", "team_compta", "team_juridique"];
    if (!ALLOWED_KEYS.includes(key)) return res.status(400).json({ error: "Clé non autorisée" });

    const ext = (type || "image/jpeg").split("/")[1] || "jpg";
    const filename = `setting-${key}-${Date.now()}.${ext}`;
    const { url } = await uploadBase64(image, filename);

    // Upsert — insert ou update si la clé existe déjà
    const exists = await prepare("SELECT id FROM settings WHERE key=?").get(key);
    if (exists) {
      await prepare("UPDATE settings SET value=?, updated_at=NOW() WHERE key=?").run(url, key);
    } else {
      await prepare("INSERT INTO settings(key, value) VALUES(?,?)").run(key, url);
    }
    res.json({ key, url });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/settings/:key — supprimer une image
router.delete("/:key", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  try {
    await prepare("DELETE FROM settings WHERE key=?").run(req.params.key);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;