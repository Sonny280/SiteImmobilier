const express = require("express");
const router = express.Router();
const { prepare } = require("../config/database");
const { auth, requireModule } = require("../middleware/auth");
const { upload, photoUrl, deleteFile } = require("../config/upload");
const fs = require("fs");
const path = require("path");
const { UPLOAD_DIR } = require("../config/upload");

function slug(titre, id) {
  return titre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").trim()+`-${id}`;
}
function withPhotos(b) {
  if (!b) return null;
  const photos = prepare("SELECT * FROM photos WHERE bienId=? ORDER BY principale DESC, position ASC").all(b.id).map(p=>({...p,url:photoUrl(p.filename)||p.url}));
  return {...b, photos, photo_principale: photos[0]||null};
}

router.get("/", (req,res) => {
  const {type,statut,commune,min_prix,max_prix,chambres,search,featured,limit=100,offset=0}=req.query;
  let sql="SELECT * FROM biens WHERE statut != 'archive'";
  const p=[];
  if(type)     {sql+=" AND type=?";p.push(type);}
  if(statut)   {sql+=" AND statut=?";p.push(statut);}
  if(commune)  {sql+=" AND (commune LIKE ? OR quartier LIKE ?)";p.push(`%${commune}%`,`%${commune}%`);}
  if(min_prix) {sql+=" AND prix>=?";p.push(+min_prix);}
  if(max_prix) {sql+=" AND prix<=?";p.push(+max_prix);}
  if(chambres) {sql+=" AND chambres>=?";p.push(+chambres);}
  if(featured) {sql+=" AND featured=1";}
  if(search)   {sql+=" AND (titre LIKE ? OR quartier LIKE ? OR commune LIKE ? OR description LIKE ?)";p.push(...Array(4).fill(`%${search}%`));}
  sql+=" ORDER BY featured DESC, createdAt DESC LIMIT ? OFFSET ?";
  p.push(+limit,+offset);
  const biens=prepare(sql).all(...p).map(withPhotos);
  const total=prepare("SELECT COUNT(*) as c FROM biens WHERE statut!='archive'").get().c;
  res.json({biens,total});
});

router.get("/stats",(_, res)=>{
  res.json({total:prepare("SELECT COUNT(*) as c FROM biens WHERE statut!='archive'").get().c,disponible:prepare("SELECT COUNT(*) as c FROM biens WHERE statut='disponible'").get().c,loue:prepare("SELECT COUNT(*) as c FROM biens WHERE statut='loue'").get().c,vente:prepare("SELECT COUNT(*) as c FROM biens WHERE type='vente' AND statut!='archive'").get().c,location:prepare("SELECT COUNT(*) as c FROM biens WHERE type='location' AND statut!='archive'").get().c,meuble:prepare("SELECT COUNT(*) as c FROM biens WHERE type='meuble' AND statut!='archive'").get().c});
});

router.get("/:id",(req,res)=>{
  const b=isNaN(req.params.id)?prepare("SELECT * FROM biens WHERE slug=?").get(req.params.id):prepare("SELECT * FROM biens WHERE id=?").get(+req.params.id);
  if(!b) return res.status(404).json({error:"Bien introuvable"});
  prepare("UPDATE biens SET vues=vues+1 WHERE id=?").run(b.id);
  res.json(withPhotos(b));
});

router.post("/",auth,requireModule("biens"),(req,res)=>{
  const {titre,type,prix,surface,chambres,sdb,etage,parking,quartier,commune,ville,adresse,statut,description,equipements,whatsapp,telephone,featured,meta_title,meta_desc}=req.body;
  if(!titre||!type||!prix) return res.status(400).json({error:"titre, type, prix requis"});
  const count=prepare("SELECT COUNT(*) as c FROM biens").get().c;
  const ref=`SEI-${String(count+1).padStart(3,"0")}`;
  const emoji={location:"🏢",meuble:"🛋️",vente:"🏡"}[type]||"🏠";
  const r=prepare("INSERT INTO biens (ref,titre,type,prix,surface,chambres,sdb,etage,parking,quartier,commune,ville,adresse,statut,description,equipements,whatsapp,telephone,featured,emoji,meta_title,meta_desc) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(ref,titre,type,+prix,surface||null,+chambres||0,+sdb||0,etage||null,+parking||0,quartier||"",commune||"",ville||"Abidjan",adresse||"",statut||"disponible",description||"",equipements||"",whatsapp||"",telephone||"",featured?1:0,emoji,meta_title||"",meta_desc||"");
  prepare("UPDATE biens SET slug=? WHERE id=?").run(slug(titre,r.lastInsertRowid),r.lastInsertRowid);
  res.status(201).json(withPhotos(prepare("SELECT * FROM biens WHERE id=?").get(r.lastInsertRowid)));
});

router.put("/:id",auth,requireModule("biens"),(req,res)=>{
  const id=+req.params.id;
  const curr=prepare("SELECT * FROM biens WHERE id=?").get(id);
  if(!curr) return res.status(404).json({error:"Bien introuvable"});
  let {titre,type,prix,surface,chambres,sdb,etage,parking,quartier,commune,ville,adresse,statut,description,equipements,whatsapp,telephone,featured,meta_title,meta_desc}=req.body;
  // Empêcher de forcer manuellement "loue" ou "vendu" sans relation réelle —
  // ces statuts ne doivent être posés que par les routes contrats/ventes.
  if((statut==="loue"||statut==="vendu") && curr.statut!==statut){
    const hasClient = prepare("SELECT COUNT(*) as n FROM clients WHERE bienId=? AND type='locataire'").get(id).n>0;
    const hasVente   = prepare("SELECT COUNT(*) as n FROM ventes WHERE bienId=? AND statut!='annulee'").get(id).n>0;
    if(statut==="loue" && !hasClient) return res.status(400).json({error:"Impossible de marquer ce bien comme loué sans locataire associé. Créez d'abord un contrat de bail."});
    if(statut==="vendu" && !hasVente) return res.status(400).json({error:"Impossible de marquer ce bien comme vendu sans dossier de vente finalisé. Utilisez le module Ventes."});
  }
  prepare("UPDATE biens SET titre=?,type=?,prix=?,surface=?,chambres=?,sdb=?,etage=?,parking=?,quartier=?,commune=?,ville=?,adresse=?,statut=?,description=?,equipements=?,whatsapp=?,telephone=?,featured=?,slug=?,meta_title=?,meta_desc=?,updatedAt=datetime('now') WHERE id=?").run(titre,type,+prix,surface||null,+chambres||0,+sdb||0,etage||null,+parking||0,quartier||"",commune||"",ville||"Abidjan",adresse||"",statut||"disponible",description||"",equipements||"",whatsapp||"",telephone||"",featured?1:0,slug(titre,id),meta_title||"",meta_desc||"",id);
  res.json(withPhotos(prepare("SELECT * FROM biens WHERE id=?").get(id)));
});

router.delete("/:id",auth,requireModule("biens"),(req,res)=>{
  prepare("DELETE FROM biens WHERE id=?").run(+req.params.id);
  res.json({success:true});
});

// Upload via multipart (méthode 1)
router.post("/:id/photos",auth,requireModule("biens"),upload.array("photos",10),(req,res)=>{
  const bienId=+req.params.id;
  if(!req.files?.length) return res.status(400).json({error:"Aucun fichier. Utilisez /photos/base64 si ce endpoint échoue."});
  const existing=prepare("SELECT COUNT(*) as c FROM photos WHERE bienId=?").get(bienId).c;
  const inserted=[];
  req.files.forEach((file,i)=>{
    const url=photoUrl(file.filename);
    const principale=(existing+i)===0?1:0;
    const r=prepare("INSERT INTO photos (bienId,url,filename,position,principale) VALUES (?,?,?,?,?)").run(bienId,url,file.filename,existing+i,principale);
    inserted.push({id:r.lastInsertRowid,url,filename:file.filename,principale});
  });
  res.status(201).json({success:true,photos:inserted});
});

// Upload via base64 (méthode 2 — recommandée, fonctionne partout)
// SÉCURITÉ : l'extension du fichier écrit sur disque ne doit JAMAIS dépendre
// directement du champ "type" envoyé par le client. Sans cette liste blanche,
// un client malveillant pourrait envoyer {type:"image/php", data:"<?php ...?>"}
// et faire écrire un fichier .php exécutable dans /uploads (RCE).
const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/jpg":  "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};
router.post("/:id/photos/base64",auth,requireModule("biens"),(req,res)=>{
  const bienId=+req.params.id;
  const {images}=req.body;
  if(!images?.length) return res.status(400).json({error:"Aucune image"});
  if(images.length>10) return res.status(400).json({error:"Maximum 10 images à la fois"});
  const existing=prepare("SELECT COUNT(*) as c FROM photos WHERE bienId=?").get(bienId).c;
  const inserted=[];
  images.forEach((img,i)=>{
    try {
      // Liste blanche stricte — toute image dont le type ne figure pas ici est rejetée.
      const ext = MIME_TO_EXT[(img.type||"").toLowerCase()];
      if (!ext) { console.error("Upload refusé — type non autorisé:", img.type); return; }
      // Vérifie aussi que les données déclarées correspondent au préfixe data URL attendu,
      // pour limiter les tentatives de contournement basiques.
      const match = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.exec(img.data || "");
      if (!match) { console.error("Upload refusé — préfixe data URL invalide"); return; }
      const data = img.data.slice(match[0].length);
      // Garde-fou supplémentaire sur la taille décodée (8 Mo max, identique à la voie multipart).
      const sizeBytes = Buffer.byteLength(data, "base64");
      if (sizeBytes > 8*1024*1024) { console.error("Upload refusé — fichier trop volumineux"); return; }
      const filename=`${Date.now()}-${Math.floor(Math.random()*99999)}.${ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR,filename),Buffer.from(data,"base64"));
      const url=photoUrl(filename);
      const principale=(existing+i)===0?1:0;
      const r=prepare("INSERT INTO photos (bienId,url,filename,position,principale) VALUES (?,?,?,?,?)").run(bienId,url,filename,existing+i,principale);
      inserted.push({id:r.lastInsertRowid,url,filename,principale});
    } catch(e){console.error("Upload error:",e.message);}
  });
  if (inserted.length===0) return res.status(400).json({error:"Aucune image valide n'a pu être traitée."});
  res.status(201).json({success:true,photos:inserted});
});

router.delete("/:id/photos/:photoId",auth,requireModule("biens"),(req,res)=>{
  const photo=prepare("SELECT * FROM photos WHERE id=? AND bienId=?").get(+req.params.photoId,+req.params.id);
  if(!photo) return res.status(404).json({error:"Photo introuvable"});
  deleteFile(photo.filename);
  prepare("DELETE FROM photos WHERE id=?").run(photo.id);
  if(photo.principale){const next=prepare("SELECT id FROM photos WHERE bienId=? ORDER BY position LIMIT 1").get(+req.params.id);if(next)prepare("UPDATE photos SET principale=1 WHERE id=?").run(next.id);}
  res.json({success:true});
});

router.put("/:id/photos/:photoId/principale",auth,requireModule("biens"),(req,res)=>{
  const bienId=+req.params.id;
  prepare("UPDATE photos SET principale=0 WHERE bienId=?").run(bienId);
  prepare("UPDATE photos SET principale=1 WHERE id=?").run(+req.params.photoId);
  res.json({success:true});
});

module.exports = router;
