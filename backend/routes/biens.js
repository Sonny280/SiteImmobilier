// routes/biens.js
const express  = require("express");
const router   = express.Router();
const path     = require("path");
const fs       = require("fs");
const { prepare } = require("../config/database");
const { auth, requireModule } = require("../middleware/auth");
const { upload, photoUrl, UPLOAD_DIR } = require("../config/upload");

function slug(titre, id) {
  return titre.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9\s-]/g,"")
    .replace(/\s+/g,"-").trim() + `-${id}`;
}

// Ajoute les photos à un bien — async car prepare().all() est une Promise en prod
async function withPhotos(b) {
  if (!b) return null;
  const photos = await prepare(
    "SELECT * FROM photos WHERE bienId=? ORDER BY principale DESC, position ASC"
  ).all(b.id);
  const photosWithUrl = photos.map(p => ({...p, url: photoUrl(p.filename) || p.url}));
  return {...b, photos: photosWithUrl, photo_principale: photosWithUrl[0] || null};
}

// MIME whitelist pour uploads base64
const MIME_TO_EXT = {
  "image/jpeg": "jpg", "image/jpg": "jpg",
  "image/png": "png", "image/webp": "webp", "image/gif": "gif",
};

// GET /api/biens
router.get("/", async (req, res) => {
  try {
    const {type,statut,commune,min_prix,max_prix,chambres,search,featured,limit=100,offset=0} = req.query;
    let sql = "SELECT * FROM biens WHERE statut != 'archive'";
    const p = [];
    if (type)     { sql += " AND type=?";    p.push(type); }
    if (statut)   { sql += " AND statut=?";  p.push(statut); }
    if (commune)  { sql += " AND (commune LIKE ? OR quartier LIKE ?)"; p.push(`%${commune}%`, `%${commune}%`); }
    if (min_prix) { sql += " AND prix>=?";   p.push(+min_prix); }
    if (max_prix) { sql += " AND prix<=?";   p.push(+max_prix); }
    if (chambres) { sql += " AND chambres>=?"; p.push(+chambres); }
    if (featured) { sql += " AND featured=1"; }
    if (search)   { sql += " AND (titre LIKE ? OR quartier LIKE ? OR commune LIKE ? OR description LIKE ?)"; p.push(...Array(4).fill(`%${search}%`)); }
    sql += " ORDER BY featured DESC, createdAt DESC LIMIT ? OFFSET ?";
    p.push(+limit, +offset);

    const rawBiens = await prepare(sql).all(...p);
    const biens = await Promise.all(rawBiens.map(withPhotos));
    const totRow = await prepare("SELECT COUNT(*) as c FROM biens WHERE statut!='archive'").get();
    res.json({ biens, total: totRow?.c || 0 });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/biens/stats
router.get("/stats", async (_, res) => {
  try {
    const [tot, disp, loue, ven, loc, meu] = await Promise.all([
      prepare("SELECT COUNT(*) as c FROM biens WHERE statut!='archive'").get(),
      prepare("SELECT COUNT(*) as c FROM biens WHERE statut='disponible'").get(),
      prepare("SELECT COUNT(*) as c FROM biens WHERE statut='loue'").get(),
      prepare("SELECT COUNT(*) as c FROM biens WHERE type='vente' AND statut!='archive'").get(),
      prepare("SELECT COUNT(*) as c FROM biens WHERE type='location' AND statut!='archive'").get(),
      prepare("SELECT COUNT(*) as c FROM biens WHERE type='meuble' AND statut!='archive'").get(),
    ]);
    res.json({ total:tot?.c||0, disponible:disp?.c||0, loue:loue?.c||0, vente:ven?.c||0, location:loc?.c||0, meuble:meu?.c||0 });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/biens/:id
router.get("/:id", async (req, res) => {
  try {
    const b = isNaN(req.params.id)
      ? await prepare("SELECT * FROM biens WHERE slug=?").get(req.params.id)
      : await prepare("SELECT * FROM biens WHERE id=?").get(+req.params.id);
    if (!b) return res.status(404).json({ error: "Bien introuvable" });
    await prepare("UPDATE biens SET vues=vues+1 WHERE id=?").run(b.id);
    res.json(await withPhotos(b));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/biens
router.post("/", auth, requireModule("biens"), async (req, res) => {
  try {
    const {titre,type,prix,surface,chambres,sdb,etage,parking,quartier,commune,ville,adresse,statut,description,equipements,whatsapp,telephone,featured,meta_title,meta_desc} = req.body;
    if (!titre || !type || !prix) return res.status(400).json({ error: "titre, type et prix requis" });
    const count = await prepare("SELECT COUNT(*) as c FROM biens").get();
    const ref = `B-${new Date().getFullYear()}-${String((count?.c||0)+1).padStart(4,"0")}`;
    const r = await prepare("INSERT INTO biens(ref,titre,type,prix,surface,chambres,sdb,etage,parking,quartier,commune,ville,adresse,statut,description,equipements,whatsapp,telephone,featured,slug,meta_title,meta_desc) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(
      ref,titre,type,+prix,surface||null,+chambres||0,+sdb||0,etage||null,+parking||0,
      quartier||"",commune||"",ville||"Abidjan",adresse||"",statut||"disponible",
      description||"",equipements||"",whatsapp||"",telephone||"",featured?1:0,
      slug(titre, 0), meta_title||"", meta_desc||""
    );
    const id = r.lastInsertRowid;
    await prepare("UPDATE biens SET slug=? WHERE id=?").run(slug(titre, id), id);
    const bien = await prepare("SELECT * FROM biens WHERE id=?").get(id);
    res.status(201).json(await withPhotos(bien));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/biens/:id
router.put("/:id", auth, requireModule("biens"), async (req, res) => {
  try {
    const id = +req.params.id;
    const curr = await prepare("SELECT * FROM biens WHERE id=?").get(id);
    if (!curr) return res.status(404).json({ error: "Bien introuvable" });
    let {titre,type,prix,surface,chambres,sdb,etage,parking,quartier,commune,ville,adresse,statut,description,equipements,whatsapp,telephone,featured,meta_title,meta_desc} = req.body;
    if ((statut==="loue"||statut==="vendu") && curr.statut!==statut) {
      const hasClient = await prepare("SELECT COUNT(*) as n FROM clients WHERE bienId=? AND type='locataire'").get(id);
      const hasVente  = await prepare("SELECT COUNT(*) as n FROM ventes WHERE bienId=? AND statut!='annulee'").get(id);
      if (statut==="loue"  && !(hasClient?.n > 0)) return res.status(400).json({ error: "Impossible : aucun locataire associé." });
      if (statut==="vendu" && !(hasVente?.n  > 0)) return res.status(400).json({ error: "Impossible : aucune vente finalisée." });
    }
    await prepare("UPDATE biens SET titre=?,type=?,prix=?,surface=?,chambres=?,sdb=?,etage=?,parking=?,quartier=?,commune=?,ville=?,adresse=?,statut=?,description=?,equipements=?,whatsapp=?,telephone=?,featured=?,slug=?,meta_title=?,meta_desc=?,updatedAt=CURRENT_TIMESTAMP WHERE id=?").run(
      titre,type,+prix,surface||null,+chambres||0,+sdb||0,etage||null,+parking||0,
      quartier||"",commune||"",ville||"Abidjan",adresse||"",statut||"disponible",
      description||"",equipements||"",whatsapp||"",telephone||"",featured?1:0,
      slug(titre,id),meta_title||"",meta_desc||"",id
    );
    res.json(await withPhotos(await prepare("SELECT * FROM biens WHERE id=?").get(id)));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/biens/:id
router.delete("/:id", auth, requireModule("biens"), async (req, res) => {
  try {
    const id = +req.params.id;
    const b = await prepare("SELECT * FROM biens WHERE id=?").get(id);
    if (!b) return res.status(404).json({ error: "Introuvable" });
    const photos = await prepare("SELECT * FROM photos WHERE bienId=?").all(id);
    for (const p of photos) {
      if (p.filename) { const fp = path.join(UPLOAD_DIR, p.filename); if (fs.existsSync(fp)) fs.unlinkSync(fp); }
    }
    await prepare("DELETE FROM photos WHERE bienId=?").run(id);
    await prepare("DELETE FROM biens WHERE id=?").run(id);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/biens/:id/photos (multipart)
router.post("/:id/photos", auth, requireModule("biens"), upload.array("photos", 10), async (req, res) => {
  try {
    const bienId = +req.params.id;
    if (!req.files?.length) return res.status(400).json({ error: "Aucun fichier." });
    const existRow = await prepare("SELECT COUNT(*) as c FROM photos WHERE bienId=?").get(bienId);
    const existing = existRow?.c || 0;
    const inserted = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const url = photoUrl(file.filename);
      const principale = (existing + i) === 0 ? 1 : 0;
      const r = await prepare("INSERT INTO photos(bienId,url,filename,position,principale) VALUES(?,?,?,?,?)").run(bienId, url, file.filename, existing + i, principale);
      inserted.push({ id: r.lastInsertRowid, url, filename: file.filename, principale });
    }
    res.status(201).json({ success: true, photos: inserted });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/biens/:id/photos/base64
router.post("/:id/photos/base64", auth, requireModule("biens"), async (req, res) => {
  try {
    const bienId = +req.params.id;
    const { images } = req.body;
    if (!images?.length) return res.status(400).json({ error: "Aucune image" });
    if (images.length > 10) return res.status(400).json({ error: "Maximum 10 images" });
    const existRow = await prepare("SELECT COUNT(*) as c FROM photos WHERE bienId=?").get(bienId);
    const existing = existRow?.c || 0;
    const inserted = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const ext = MIME_TO_EXT[(img.type||"").toLowerCase()];
      if (!ext) continue;
      const match = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.exec(img.data || "");
      if (!match) continue;
      const data = img.data.slice(match[0].length);
      if (Buffer.byteLength(data, "base64") > 8 * 1024 * 1024) continue;
      const filename = `${Date.now()}-${Math.floor(Math.random()*99999)}.${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, filename), Buffer.from(data, "base64"));
      const url = photoUrl(filename);
      const principale = (existing + i) === 0 ? 1 : 0;
      const r = await prepare("INSERT INTO photos(bienId,url,filename,position,principale) VALUES(?,?,?,?,?)").run(bienId, url, filename, existing + i, principale);
      inserted.push({ id: r.lastInsertRowid, url, filename, principale });
    }
    if (!inserted.length) return res.status(400).json({ error: "Aucune image valide." });
    res.status(201).json({ success: true, photos: inserted });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/biens/:id/photos/:photoId
router.delete("/:id/photos/:photoId", auth, requireModule("biens"), async (req, res) => {
  try {
    const p = await prepare("SELECT * FROM photos WHERE id=?").get(+req.params.photoId);
    if (!p) return res.status(404).json({ error: "Photo introuvable" });
    if (p.filename) { const fp = path.join(UPLOAD_DIR, p.filename); if (fs.existsSync(fp)) fs.unlinkSync(fp); }
    await prepare("DELETE FROM photos WHERE id=?").run(+req.params.photoId);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/biens/:id/photos/:photoId/principale
router.put("/:id/photos/:photoId/principale", auth, requireModule("biens"), async (req, res) => {
  try {
    const bienId = +req.params.id;
    await prepare("UPDATE photos SET principale=0 WHERE bienId=?").run(bienId);
    await prepare("UPDATE photos SET principale=1 WHERE id=?").run(+req.params.photoId);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;

