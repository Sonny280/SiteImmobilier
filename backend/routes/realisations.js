// routes/realisations.js
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth, requireRole } = require("../middleware/auth");
const { uploadBase64 } = require("../config/upload");

// GET public
router.get("/", async (req, res) => {
  try {
    const rows = await prepare("SELECT * FROM realisations WHERE visible=1 ORDER BY ordre ASC, createdAt DESC").all();
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET admin
router.get("/admin", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  try {
    const rows = await prepare("SELECT * FROM realisations ORDER BY ordre ASC, createdAt DESC").all();
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST upload image — vers Cloudinary
router.post("/upload-image", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  try {
    const { image, type, nom } = req.body;
    if (!image) return res.status(400).json({ error: "Image requise" });
    const ext = (type||"image/jpeg").split("/")[1] || "jpg";
    const filename = `realisation-${Date.now()}.${ext}`;
    const { url } = await uploadBase64(image, filename);
    res.json({ url });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST créer
router.post("/", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  try {
    const { titre, type, description, annee, commune, ville, image, ordre, visible } = req.body;
    if (!titre) return res.status(400).json({ error: "Titre requis" });
    const r = await prepare("INSERT INTO realisations(titre,type,description,annee,commune,ville,image,ordre,visible) VALUES(?,?,?,?,?,?,?,?,?)").run(
      titre, type||"Gestion locative", description||"", annee||"", commune||"", ville||"Abidjan", image||"", +ordre||0, visible!==undefined?+visible:1
    );
    res.status(201).json(await prepare("SELECT * FROM realisations WHERE id=?").get(r.lastInsertRowid));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT modifier
router.put("/:id", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  try {
    const id = +req.params.id;
    const { titre, type, description, annee, commune, ville, image, ordre, visible } = req.body;
    await prepare("UPDATE realisations SET titre=?,type=?,description=?,annee=?,commune=?,ville=?,image=?,ordre=?,visible=? WHERE id=?").run(
      titre, type||"Gestion locative", description||"", annee||"", commune||"", ville||"Abidjan", image||"", +ordre||0, visible!==undefined?+visible:1, id
    );
    res.json(await prepare("SELECT * FROM realisations WHERE id=?").get(id));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE
router.delete("/:id", auth, requireRole(["superadmin","admin"]), async (req, res) => {
  try {
    await prepare("DELETE FROM realisations WHERE id=?").run(+req.params.id);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

