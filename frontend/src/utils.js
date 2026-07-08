// utils.js
export const API     = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
export const BACKEND = API.replace("/api","");

export const fmt  = n => new Intl.NumberFormat("fr-CI").format(n||0);
export const fmtM = n => n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${Math.round(n/1000)}k`:fmt(n);
export const wa   = num => `https://wa.me/${(num||"").replace(/\D/g,"")}`;

export const photoSrc = p => {
  if(!p) return null;
  const url = typeof p==="string"?p:(p.url||"");
  if(!url) return null;
  if(url.startsWith("data:")||url.startsWith("http")) return url;
  return `${BACKEND}${url}`;
};

export const TL = {location:"Location",meuble:"Meublé",vente:"Vente",terrain:"Terrain"};
export const TC = {location:"badge-dispo",meuble:"badge-meuble",vente:"badge-vente",terrain:"badge-terrain"};
export const SC = {
  disponible:"badge-dispo",loue:"badge-loue",en_cours:"badge-cours",vendu:"badge-vente",
  paye:"badge-dispo",impaye:"badge-vente",en_attente:"badge-cours",
  nouveau:"badge-loue",traite:"",actif:"badge-dispo",renouveler:"badge-cours",
  prospect:"",offre:"badge-loue",compromis:"badge-cours",financement:"badge-meuble",
  acte:"badge-cours",finalisee:"badge-dispo",annulee:"badge-vente",
  planifie:"badge-loue",effectue:"badge-dispo",
};
export const SL = {
  disponible:"Disponible",loue:"Loué",en_cours:"En cours",vendu:"Vendu",
  paye:"Payé",impaye:"Impayé",en_attente:"En attente",
  nouveau:"Nouveau",traite:"Traité",actif:"Actif",renouveler:"À renouveler",
  prospect:"Prospect",offre:"Offre faite",compromis:"Compromis signé",
  financement:"Financement",acte:"Acte en cours",finalisee:"Finalisée",annulee:"Annulée",
  planifie:"Planifiée",effectue:"Effectuée",
};
export const ETAPES_VENTE = ["prospect","offre","compromis","financement","acte","finalisee"];
export const GRADS = [
  "from-blue-900 to-blue-800","from-slate-800 to-blue-900",
  "from-gray-800 to-slate-900","from-blue-800 to-indigo-900",
];

export const AG = {
  nom:"ImmobilierCI", directeur:"Kouassi Atse Charles",
  slogan:"Votre confiance, notre expertise immobilière.",
  tel1:"+225 07 57 86 48 36", tel2:"+225 07 57 86 48 36",
  whatsapp:"+225 07 57 86 48 36", waRaw:"+2250757864836",
  email:"contact@immobilierci.ci",
  horaires:"Lun – Ven 8h00 – 18h00",
  adresse:"Abidjan, Côte d'Ivoire",
  zone:"Toute la Côte d'Ivoire",
  social:{
    instagram:"https://instagram.com/immobilierci",
    facebook:"https://facebook.com/immobilierci",
    linkedin:"https://linkedin.com/company/immobilierci",
    youtube:"https://youtube.com/@immobilierci",
  },
  mapEmbed:"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127536.10782961!2d-3.978!3d5.354!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfc1ea5311959ad5%3A0xe19d2b47be5e7f5a!2sAbidjan%2C%20C%C3%B4te%20d'Ivoire!5e0!3m2!1sfr!2s!4v1715000000000",
};

export const DEMO = {
  biens:[
    {id:1,ref:"LI-001",titre:"Appartement F3 climatisé",type:"location",prix:350000,surface:90,chambres:3,sdb:2,etage:2,parking:1,quartier:"Cocody Riviera 3",commune:"Cocody",ville:"Abidjan",statut:"loue",featured:1,description:"Bel appartement F3 entièrement climatisé avec parking privé et gardiennage 24h/24.",equipements:"Climatisation,Parking,Gardiennage,Cuisine équipée,Balcon",whatsapp:"+2250757864836",telephone:"+2250711710101",vues:142,photos:[]},
    {id:2,ref:"LI-002",titre:"Studio moderne tout confort",type:"location",prix:180000,surface:35,chambres:1,sdb:1,etage:3,parking:0,quartier:"Plateau Dokui",commune:"Plateau",ville:"Abidjan",statut:"loue",featured:0,description:"Studio au 3ème étage avec vue dégagée.",equipements:"Eau chaude,Cuisine équipée,Sécurité",whatsapp:"+2250757864836",telephone:"+2250711710101",vues:89,photos:[]},
    {id:3,ref:"LI-003",titre:"Villa F4 avec jardin",type:"location",prix:500000,surface:160,chambres:4,sdb:3,parking:2,quartier:"Marcory Zone 4",commune:"Marcory",ville:"Abidjan",statut:"loue",featured:0,description:"Grande villa avec jardin tropical, double garage et gardien résidant.",equipements:"Jardin,Double garage,Gardien,Climatisation",whatsapp:"+2250757864836",telephone:"+2250711710101",vues:203,photos:[]},
    {id:4,ref:"LI-004",titre:"Appartement meublé haut standing",type:"meuble",prix:420000,surface:65,chambres:2,sdb:1,etage:4,parking:1,quartier:"Angré 8ème Tranche",commune:"Cocody",ville:"Abidjan",statut:"disponible",featured:1,description:"Appartement entièrement meublé. WiFi fibre inclus.",equipements:"Meublé complet,WiFi fibre,Parking,Smart TV,Climatisation",whatsapp:"+2250757864836",telephone:"+2250711710101",vues:317,photos:[]},
    {id:5,ref:"LI-005",titre:"Suite prestige vue lagune",type:"meuble",prix:650000,surface:120,chambres:3,sdb:2,etage:8,parking:1,quartier:"Plateau Centre",commune:"Plateau",ville:"Abidjan",statut:"disponible",featured:0,description:"Vue panoramique sur la lagune Ébrié.",equipements:"Vue lagune,Meublé luxe,WiFi,Parking",whatsapp:"+2250757864836",telephone:"+2250711710101",vues:95,photos:[]},
    {id:6,ref:"LI-006",titre:"Villa prestige avec piscine",type:"vente",prix:85000000,surface:280,chambres:5,sdb:4,parking:2,quartier:"Riviera Golf",commune:"Cocody",ville:"Abidjan",statut:"en_cours",featured:1,description:"Villa d'exception avec piscine à débordement.",equipements:"Piscine,Double garage,Domotique,Climatisation,Jardin paysagé",whatsapp:"+2250757864836",telephone:"+2250711710101",vues:412,photos:[]},
    {id:7,ref:"LI-007",titre:"Duplex neuf standing",type:"vente",prix:45000000,surface:180,chambres:4,sdb:3,parking:1,quartier:"Cocody Angré",commune:"Cocody",ville:"Abidjan",statut:"disponible",featured:0,description:"Duplex neuf, finitions haut de gamme.",equipements:"Neuf,Titre foncier,Parking,Climatisation",whatsapp:"+2250757864836",telephone:"+2250711710101",vues:178,photos:[]},
    {id:8,ref:"LI-008",titre:"Terrain résidentiel 500m²",type:"terrain",prix:12000000,surface:500,chambres:0,sdb:0,parking:0,quartier:"Bingerville",commune:"Bingerville",ville:"Abidjan",statut:"disponible",featured:0,description:"Terrain résidentiel viabilisé, titre foncier en règle.",equipements:"Titre foncier,Viabilisé,Électricité,Eau",whatsapp:"+2250757864836",telephone:"+2250711710101",vues:88,photos:[]},
  ],
  clients:[
    {id:1,nom:"Koné Amara",email:"kone.amara@gmail.com",tel:"+225 07 11 22 33",whatsapp:"+22507112233",type:"locataire",bienId:1,bienTitre:"Appartement F3",dateEntree:"2024-03-01",caution:700000,loyer:350000,profession:"Ingénieur"},
    {id:2,nom:"Bamba Seydou",email:"s.bamba@email.ci",tel:"+225 05 44 55 66",whatsapp:"+22505445566",type:"locataire",bienId:2,bienTitre:"Studio moderne",dateEntree:"2024-04-15",caution:360000,loyer:180000,profession:"Fonctionnaire"},
    {id:3,nom:"Cissé Modibo",email:"m.cisse@corp.com",tel:"+225 01 77 88 99",whatsapp:"+22501778899",type:"locataire",bienId:3,bienTitre:"Villa F4",dateEntree:"2024-06-01",caution:1000000,loyer:500000,profession:"Directeur commercial"},
    {id:4,nom:"Diallo Mamadou",email:"m.diallo@yahoo.fr",tel:"+225 05 23 99 10",whatsapp:"+22505239910",type:"acheteur",bienId:null,bienTitre:null,notes:"Intéressé villa Riviera Golf"},
    {id:5,nom:"Coulibaly Fatou",email:"f.coul@gmail.com",tel:"+225 07 65 43 21",whatsapp:"+22507654321",type:"prospect",bienId:null,bienTitre:null,notes:"Cherche meublé Cocody"},
  ],
  loyers:[
    {id:1,clientId:1,bienId:1,montant:350000,mois:"2025-05",echeance:"2025-05-01",statut:"paye",datePaiement:"2025-05-02",modePaiement:"virement",clientNom:"Koné Amara",clientTel:"+22507112233",clientWa:"+22507112233",bienTitre:"Appartement F3",joursRetard:0,penalite:0},
    {id:2,clientId:2,bienId:2,montant:180000,mois:"2025-05",echeance:"2025-05-01",statut:"paye",datePaiement:"2025-05-03",modePaiement:"mobile_money",clientNom:"Bamba Seydou",clientTel:"+22505445566",clientWa:"+22505445566",bienTitre:"Studio moderne",joursRetard:0,penalite:0},
    {id:3,clientId:3,bienId:3,montant:500000,mois:"2025-05",echeance:"2025-05-01",statut:"impaye",datePaiement:null,modePaiement:"virement",clientNom:"Cissé Modibo",clientTel:"+22501778899",clientWa:"+22501778899",bienTitre:"Villa F4",joursRetard:6,penalite:0},
  ],
  ventes:[
    {id:1,ref:"VTE-2025-001",bienId:6,acheteurId:4,acheteurNom:"Diallo Mamadou",acheteurTel:"+22505239910",prixAffiche:85000000,prixFinal:80000000,tauxCommission:5,commission:4000000,statut:"compromis",paiements:[{id:1,montant:10000000,type:"acompte",date:"2025-04-15"}],totalPaye:10000000,resteAPayer:70000000,bien:{titre:"Villa prestige"}},
  ],
  demandes:[
    {id:1,nom:"Kouamé Aya",email:"aya.k@email.com",tel:"+225 07 45 12 78",interet:"meuble",budget:"400-500k/mois",message:"Je cherche un meublé moderne dans Angré ou Cocody.",statut:"nouveau",createdAt:"2025-05-06T10:00:00"},
    {id:2,nom:"Ibrahim Coulibaly",email:"i.cb@gmail.com",tel:"+225 01 56 78 00",interet:"location",budget:"400-600k/mois",message:"F3 ou F4 en location, Marcory ou Zone 4.",statut:"en_cours",createdAt:"2025-05-05T14:00:00"},
  ],
  contrats:[
    {id:1,ref:"BAI-2024-001",clientId:1,bienId:1,dateDebut:"2024-03-01",dateFin:"2025-02-28",loyer:350000,caution:700000,statut:"actif",clientNom:"Koné Amara",bienTitre:"Appartement F3"},
    {id:2,ref:"BAI-2024-002",clientId:2,bienId:2,dateDebut:"2024-04-15",dateFin:"2025-04-14",loyer:180000,caution:360000,statut:"renouveler",clientNom:"Bamba Seydou",bienTitre:"Studio moderne"},
  ],
  visites:[
    {id:1,bienId:4,nom:"Traoré Aminata",tel:"+225 05 11 22 33",date:"2025-05-15",heure:"10:00",statut:"planifie",bienTitre:"Appartement meublé haut standing"},
  ],
  temoignages:[
    {id:1,nom:"Mme Adjoua Koffi",profession:"Directeur RH, Multinationale",note:5,texte:"ImmobilierCI nous a trouvé en 48h un appartement meublé pour notre cadre expatrié. Service impeccable, très réactif.",date:"2025-03"},
    {id:2,nom:"M. Traoré Ibrahima",profession:"Chef d'entreprise",note:5,texte:"J'ai confié la gestion de mes 3 biens à ImmobilierCI. Loyers versés à temps, locataires bien sélectionnés. Je recommande vivement.",date:"2025-02"},
    {id:3,nom:"Mme Assamoi Carine",profession:"Fonctionnaire internationale",note:5,texte:"Achat de terrain facilité de A à Z. Vérification du titre foncier, accompagnement chez le notaire. Équipe sérieuse et professionnelle.",date:"2025-01"},
    {id:4,nom:"M. Coulibaly Seydou",profession:"Investisseur immobilier",note:5,texte:"Excellent travail sur la vente de ma villa à Riviera Golf. Estimation juste, transaction rapide. Très satisfait.",date:"2024-12"},
  ],
  realisations:[
    {id:1,titre:"Gestion locative — Résidence Les Palmiers",type:"Gestion locative",desc:"12 appartements gérés, taux d'occupation 98%, loyers récupérés sous 3 jours.",annee:"2024",commune:"Cocody"},
    {id:2,titre:"Vente villa prestige — Riviera Golf",type:"Vente immobilière",desc:"Villa 5 chambres avec piscine. Prix négocié, acte signé en 6 semaines.",annee:"2024",commune:"Cocody"},
    {id:3,titre:"Location meublée — expatriés Total Energies",type:"Location meublée",desc:"8 appartements meublés pour cadres expatriés. Contrats annuels renouvelés.",annee:"2023",commune:"Plateau"},
    {id:4,titre:"Vente terrain 2 hectares — Bingerville",type:"Vente terrain",desc:"2 parcelles de 1ha chacune. Titre foncier vérifié, transaction sécurisée.",annee:"2023",commune:"Bingerville"},
    {id:5,titre:"Syndic copropriété — Tour Azur",type:"Gestion copropriété",desc:"24 copropriétaires gérés. Assemblées générales, suivi travaux, comptes clairs.",annee:"2024",commune:"Plateau"},
    {id:6,titre:"Location F5 — famille diplomate",type:"Location non meublée",desc:"Villa F5 louée à famille diplomatique. Bail 3 ans, 2 500 000 FCFA/mois.",annee:"2024",commune:"Cocody"},
  ],
  articles:[
    {id:1,titre:"Comment investir dans l'immobilier à Abidjan en 2025",categorie:"Investissement",resume:"Tout ce qu'il faut savoir sur le marché immobilier ivoirien : quartiers porteurs, rendements locatifs, pièges à éviter.",date:"2025-04-15"},
    {id:2,titre:"Gestion locative : les avantages de confier son bien à une agence",categorie:"Gestion locative",resume:"Loyers garantis, locataires triés, zéro stress administratif — nos conseils pour propriétaires.",date:"2025-03-20"},
    {id:3,titre:"Titre foncier en Côte d'Ivoire : guide complet 2025",categorie:"Juridique",resume:"Démarches, délais, coûts — tout savoir sur la sécurisation juridique de votre terrain ou logement.",date:"2025-02-10"},
    {id:4,titre:"Quartiers en plein essor à Abidjan : où acheter en 2025 ?",categorie:"Marché",resume:"Bingerville, Songon, Cocody Nord, Bassam : analyse des zones à fort potentiel de valorisation.",date:"2025-01-05"},
  ],
};
