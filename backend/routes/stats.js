// routes/stats.js — v3 dashboard complet
const express = require("express");
const router  = express.Router();
const { prepare } = require("../config/database");
const { auth } = require("../middleware/auth");

router.get("/", auth, (_, res) => {
  const today = new Date().toISOString().split("T")[0];
  const mois  = today.slice(0,7);

  // Biens
  const totalBiens    = prepare("SELECT COUNT(*) as c FROM biens WHERE statut!='archive'").get().c;
  const biensDispo    = prepare("SELECT COUNT(*) as c FROM biens WHERE statut='disponible'").get().c;
  const biensLoues    = prepare("SELECT COUNT(*) as c FROM biens WHERE statut='loue'").get().c;
  const biensVente    = prepare("SELECT COUNT(*) as c FROM biens WHERE type='vente' AND statut!='archive'").get().c;
  const tauxOccup     = totalBiens>0 ? Math.round((biensLoues/totalBiens)*100) : 0;

  // Clients
  const totalClients  = prepare("SELECT COUNT(*) as c FROM clients").get().c;
  const locataires    = prepare("SELECT COUNT(*) as c FROM clients WHERE type='locataire'").get().c;

  // Loyers du mois
  const loyersMois    = prepare("SELECT SUM(montant) as t FROM loyers WHERE mois=? AND statut='paye'").get(mois)?.t||0;
  const loyersAttend  = prepare("SELECT SUM(montant) as t FROM loyers WHERE mois=?").get(mois)?.t||0;
  const nbRetards     = prepare("SELECT COUNT(*) as c FROM loyers WHERE statut IN ('impaye','en_attente') AND echeance < ?").get(today).c;
  const montRetards   = prepare("SELECT SUM(montant) as t FROM loyers WHERE statut IN ('impaye','en_attente') AND echeance < ?").get(today)?.t||0;

  // Contrats expirant dans 60 jours
  const in60 = new Date(Date.now()+60*86400000).toISOString().split("T")[0];
  const contratsExpir = prepare("SELECT COUNT(*) as c FROM contrats WHERE statut='actif' AND dateFin BETWEEN ? AND ?").get(today,in60).c;

  // Demandes
  const demandesNouv  = prepare("SELECT COUNT(*) as c FROM demandes WHERE statut='nouveau'").get().c;

  // Ventes
  const ventesEncours = prepare("SELECT COUNT(*) as c FROM ventes WHERE statut NOT IN ('finalisee','annulee')").get().c;
  const ventesFin     = prepare("SELECT COUNT(*) as c FROM ventes WHERE statut='finalisee'").get().c;
  const caVentes      = prepare("SELECT SUM(prixFinal) as t FROM ventes WHERE statut='finalisee'").get()?.t||0;
  const commissions   = prepare("SELECT SUM(commission) as t FROM ventes WHERE statut='finalisee'").get()?.t||0;

  // Graphique loyers 12 mois
  const loyers12 = prepare(`
    SELECT mois, SUM(montant) as total, COUNT(*) as nb
    FROM loyers WHERE statut='paye'
    GROUP BY mois ORDER BY mois DESC LIMIT 12
  `).all().reverse();

  // Retards avec détail (sans pénalité)
  const retards = prepare(`
    SELECT l.*, c.nom as clientNom, c.whatsapp, c.tel as clientTel, b.titre as bienTitre
    FROM loyers l
    LEFT JOIN clients c ON l.clientId=c.id
    LEFT JOIN biens   b ON l.bienId=b.id
    WHERE l.statut IN ('impaye','en_attente') AND l.echeance < ?
    ORDER BY l.echeance ASC LIMIT 10
  `).all(today).map(l=>({
    ...l,
    joursRetard: Math.floor((new Date()-new Date(l.echeance))/86400000),
    penalite: 0
  }));

  // Contrats expirant bientôt (détail)
  const contratsAlerte = prepare(`
    SELECT c.*, cl.nom as clientNom, b.titre as bienTitre
    FROM contrats c
    LEFT JOIN clients cl ON c.clientId=cl.id
    LEFT JOIN biens b    ON c.bienId=b.id
    WHERE c.statut='actif' AND c.dateFin BETWEEN ? AND ?
    ORDER BY c.dateFin ASC LIMIT 5
  `).all(today, in60);

  // Pipeline ventes
  const pipeline = prepare(`
    SELECT statut, COUNT(*) as nb
    FROM ventes WHERE statut NOT IN ('annulee')
    GROUP BY statut
  `).all();

  res.json({
    totalBiens, biensDispo, biensLoues, biensVente, tauxOccup,
    totalClients, locataires,
    loyersMois, loyersAttend, nbRetards, montRetards,
    contratsExpir, demandesNouv,
    ventesEncours, ventesFin, caVentes, commissions,
    loyers12, retards, contratsAlerte, pipeline,
  });
});

module.exports = router;
