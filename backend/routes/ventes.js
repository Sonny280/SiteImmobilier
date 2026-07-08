const express=require("express");
const router=express.Router();
const {prepare}=require("../config/database");
const {auth,requireModule}=require("../middleware/auth");

const ETAPES=["prospect","offre","compromis","financement","acte","finalisee"];

function withDetails(v){
  if(!v) return null;
  const bien=prepare("SELECT id,titre,ref,commune,quartier,prix FROM biens WHERE id=?").get(v.bienId);
  const paies=prepare("SELECT * FROM paiements_vente WHERE venteId=? ORDER BY date DESC").all(v.id);
  const totalPaye=paies.reduce((s,p)=>s+p.montant,0);
  const commission=v.prixFinal?Math.round(v.prixFinal*(v.tauxCommission||5)/100):(v.commission||0);
  return {...v,bien,paiements:paies,totalPaye,commission,resteAPayer:Math.max(0,(v.prixFinal||0)-totalPaye)};
}

router.get("/",auth,(req,res)=>{
  const {statut}=req.query;
  let sql="SELECT * FROM ventes WHERE 1=1";
  const p=[];
  if(statut&&statut!=="all"){sql+=" AND statut=?";p.push(statut);}
  sql+=" ORDER BY createdAt DESC";
  res.json(prepare(sql).all(...p).map(withDetails));
});

router.get("/stats",auth,(_, res)=>{
  res.json({total:prepare("SELECT COUNT(*) as c FROM ventes").get().c,encours:prepare("SELECT COUNT(*) as c FROM ventes WHERE statut NOT IN ('finalisee','annulee')").get().c,finalisees:prepare("SELECT COUNT(*) as c FROM ventes WHERE statut='finalisee'").get().c,caFin:prepare("SELECT SUM(prixFinal) as s FROM ventes WHERE statut='finalisee'").get()?.s||0,commissions:prepare("SELECT SUM(commission) as s FROM ventes WHERE statut='finalisee'").get()?.s||0});
});

router.get("/:id",auth,(req,res)=>{
  const v=prepare("SELECT * FROM ventes WHERE id=?").get(+req.params.id);
  if(!v) return res.status(404).json({error:"Vente introuvable"});
  res.json(withDetails(v));
});

router.post("/",auth,requireModule("ventes"),(req,res)=>{
  const {bienId,acheteurId,acheteurNom,acheteurTel,acheteurEmail,vendeurNom,vendeurTel,prixAffiche,prixNegociation,tauxCommission,modeFinancement,banque,notes}=req.body;
  if(!bienId||!prixAffiche) return res.status(400).json({error:"bienId et prixAffiche requis"});
  const count=prepare("SELECT COUNT(*) as c FROM ventes").get().c;
  const ref=`VTE-${new Date().getFullYear()}-${String(count+1).padStart(3,"0")}`;
  const r=prepare("INSERT INTO ventes (ref,bienId,acheteurId,acheteurNom,acheteurTel,acheteurEmail,vendeurNom,vendeurTel,prixAffiche,prixNegociation,tauxCommission,modeFinancement,banque,notes,statut) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'prospect')").run(ref,+bienId,acheteurId||null,acheteurNom||"",acheteurTel||"",acheteurEmail||"",vendeurNom||"",vendeurTel||"",+prixAffiche,prixNegociation||null,tauxCommission||5,modeFinancement||"cash",banque||"",notes||"");
  prepare("UPDATE biens SET statut='en_cours' WHERE id=?").run(+bienId);
  res.status(201).json(withDetails(prepare("SELECT * FROM ventes WHERE id=?").get(r.lastInsertRowid)));
});

router.put("/:id",auth,requireModule("ventes"),(req,res)=>{
  const id=+req.params.id;
  const curr=prepare("SELECT * FROM ventes WHERE id=?").get(id);
  if(!curr) return res.status(404).json({error:"Vente introuvable"});
  const ns=req.body.statut||curr.statut;
  const pf=req.body.prixFinal||curr.prixFinal;
  const pn=req.body.prixNegociation||curr.prixNegociation;
  const prixAffiche=curr.prixAffiche;
  // Le prix négocié et le prix final ne doivent jamais dépasser le prix
  // affiché initialement — règle métier qui n'était vérifiée que côté
  // interface jusqu'ici, donc contournable par un appel API direct.
  if(pf && pf>prixAffiche) return res.status(400).json({error:`Le prix final (${pf.toLocaleString("fr-CI")} FCFA) ne peut pas dépasser le prix affiché (${prixAffiche.toLocaleString("fr-CI")} FCFA).`});
  if(pn && pn>prixAffiche) return res.status(400).json({error:`Le prix négocié (${pn.toLocaleString("fr-CI")} FCFA) ne peut pas dépasser le prix affiché (${prixAffiche.toLocaleString("fr-CI")} FCFA).`});
  const tc=req.body.tauxCommission||curr.tauxCommission||5;
  if(tc<0||tc>20) return res.status(400).json({error:"Le taux de commission doit être compris entre 0 et 20%."});
  const comm=pf?Math.round(pf*(tc/100)):(req.body.commission||curr.commission||0);
  // Bloque le passage à "finalisee" si le montant payé n'a pas atteint le prix final.
  if(ns==="finalisee" && pf){
    const dejaVerse = prepare("SELECT SUM(montant) as s FROM paiements_vente WHERE venteId=?").get(id)?.s||0;
    if(dejaVerse<pf) return res.status(400).json({error:`Impossible de finaliser : il reste ${(pf-dejaVerse).toLocaleString("fr-CI")} FCFA à encaisser.`});
  }
  prepare("UPDATE ventes SET statut=?,prixFinal=?,prixNegociation=?,dateOffre=?,montantOffre=?,dateCompromis=?,dateActe=?,notaire=?,commission=?,tauxCommission=?,modeFinancement=?,banque=?,titreVerifie=?,diagnosticFait=?,notes=?,updatedAt=datetime('now') WHERE id=?").run(ns,pf||null,pn,req.body.dateOffre||curr.dateOffre,req.body.montantOffre||curr.montantOffre,req.body.dateCompromis||curr.dateCompromis,req.body.dateActe||curr.dateActe,req.body.notaire||curr.notaire,comm,tc,req.body.modeFinancement||curr.modeFinancement,req.body.banque||curr.banque,req.body.titreVerifie!==undefined?req.body.titreVerifie:curr.titreVerifie,req.body.diagnosticFait!==undefined?req.body.diagnosticFait:curr.diagnosticFait,req.body.notes||curr.notes,id);
  if(ns==="finalisee") prepare("UPDATE biens SET statut='vendu' WHERE id=?").run(curr.bienId);
  if(ns==="annulee"&&curr.statut!=="finalisee") prepare("UPDATE biens SET statut='disponible' WHERE id=?").run(curr.bienId);
  res.json(withDetails(prepare("SELECT * FROM ventes WHERE id=?").get(id)));
});

router.post("/:id/paiements",auth,requireModule("ventes"),(req,res)=>{
  const venteId=+req.params.id;
  const v=prepare("SELECT * FROM ventes WHERE id=?").get(venteId);
  if(!v) return res.status(404).json({error:"Vente introuvable"});
  const {montant,type,date,modePaiement,reference,notes}=req.body;
  if(!montant||!date) return res.status(400).json({error:"montant et date requis"});
  if(+montant<=0) return res.status(400).json({error:"Le montant doit être supérieur à 0"});
  // Règle métier essentielle : un paiement ne peut jamais faire dépasser le
  // prix final de la vente. Cette vérification existait uniquement côté
  // interface (facilement contournable via un appel API direct) — elle est
  // désormais appliquée ici, qui est la seule barrière fiable.
  if(v.prixFinal){
    const dejaVerse = prepare("SELECT SUM(montant) as s FROM paiements_vente WHERE venteId=?").get(venteId)?.s||0;
    const resteAPayer = v.prixFinal - dejaVerse;
    if(+montant>resteAPayer) return res.status(400).json({error:`Le montant dépasse le reste à payer (${resteAPayer.toLocaleString("fr-CI")} FCFA).`});
  }
  prepare("INSERT INTO paiements_vente (venteId,montant,type,date,modePaiement,reference,notes) VALUES (?,?,?,?,?,?,?)").run(venteId,+montant,type||"acompte",date,modePaiement||"virement",reference||"",notes||"");
  res.status(201).json(withDetails(prepare("SELECT * FROM ventes WHERE id=?").get(venteId)));
});

router.delete("/:id",auth,requireModule("ventes"),(req,res)=>{
  const v=prepare("SELECT * FROM ventes WHERE id=?").get(+req.params.id);
  if(v&&!["finalisee"].includes(v.statut)) prepare("UPDATE biens SET statut='disponible' WHERE id=?").run(v.bienId);
  prepare("DELETE FROM ventes WHERE id=?").run(+req.params.id);
  res.json({success:true});
});

module.exports=router;
