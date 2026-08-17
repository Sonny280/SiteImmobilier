// utils/genContrats.js — Génération contrats Word depuis les données du logiciel
// Utilise la même librairie docx que les reçus mais côté backend via une route API

import { AG } from "../utils.js";

// Convertit un nombre en lettres (FCFA)
function nombreEnLettres(n) {
  if (!n || isNaN(n)) return "___________________________";
  const u = ["","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
  const d = ["","","vingt","trente","quarante","cinquante","soixante","soixante","quatre-vingt","quatre-vingt"];
  function conv(nb) {
    if (nb === 0) return "zéro";
    if (nb < 20) return u[nb];
    if (nb < 100) {
      const dd = Math.floor(nb/10), ud = nb%10;
      if (dd === 7 || dd === 9) return d[dd] + (ud === 1 ? "-et-" : "-") + u[10 + ud];
      return d[dd] + (ud === 1 && dd !== 8 ? "-et-" : ud ? "-" : "") + (ud ? u[ud] : (dd===8?"s":""));
    }
    if (nb < 1000) {
      const c = Math.floor(nb/100), r = nb%100;
      return (c > 1 ? u[c]+"-cent" : "cent") + (r ? (c>1?"s":"")+"-"+conv(r) : (c>1?"s":""));
    }
    if (nb < 1000000) {
      const m = Math.floor(nb/1000), r = nb%1000;
      return (m > 1 ? conv(m)+"-mille" : "mille") + (r ? "-"+conv(r) : "");
    }
    const m = Math.floor(nb/1000000), r = nb%1000000;
    return conv(m)+" million"+(m>1?"s":"")+(r?"-"+conv(r):"");
  }
  return conv(Math.round(n)) + " francs CFA";
}

function fmtDate(d) {
  if (!d) return "_____ / _____ / _______";
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString("fr-FR");
}

function fmt(n) {
  if (!n) return "_____________";
  return new Intl.NumberFormat("fr-CI").format(n) + " FCFA";
}

// ── CONTRAT DE BAIL ─────────────────────────────────────────────────
export function genererContratBail({ client, bien, contrat }) {
  const today = new Date().toLocaleDateString("fr-FR");

  const data = {
    date: today,
    bailleur_nom: "ImmobilierCI (Agence mandataire)",
    bailleur_adresse: AG.adresse || "Abidjan, Côte d'Ivoire",
    bailleur_tel: AG.tel1 || "+225 07 57 86 48 36",
    locataire_nom: client?.nom || "___________________________",
    locataire_tel: client?.tel || client?.whatsapp || "___________________________",
    locataire_cni: client?.piece_identite || "___________________________",
    locataire_profession: client?.profession || "___________________________",
    locataire_employeur: client?.employeur || "___________________________",
    bien_titre: bien?.titre || "___________________________",
    bien_adresse: bien?.adresse || "___________________________",
    bien_commune: bien?.commune || "___________________________",
    bien_type: bien?.type === "location" ? "Appartement / Villa" : bien?.type === "meuble" ? "Appartement meublé" : "Bien immobilier",
    bien_surface: bien?.surface || "_____",
    bien_chambres: bien?.chambres || "_____",
    date_entree: fmtDate(client?.dateEntree || contrat?.dateDebut),
    date_fin: fmtDate(client?.dateSortie || contrat?.dateFin),
    loyer: fmt(client?.loyer || contrat?.loyer),
    caution: fmt(client?.caution || contrat?.caution),
    echeance: contrat?.echeance || "05",
    mode_paiement: "Virement bancaire / Espèces / Mobile Money",
  };

  // Construire le HTML du contrat pour impression navigateur
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8"/>
      <title>Contrat de bail — ${data.locataire_nom}</title>
      <style>
        @page { margin: 20mm 18mm; size: A4; }
        * { box-sizing: border-box; }
        body { font-family: 'Georgia', serif; font-size: 12pt; color: #333; line-height: 1.6; }
        .header { border-bottom: 2px solid #B8923F; padding-bottom: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .header .agence { font-size: 16pt; font-weight: bold; color: #5C1A2B; }
        .header .sub { font-size: 9pt; color: #56697A; }
        h1 { text-align: center; font-size: 20pt; color: #5C1A2B; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 4px; }
        .date-fait { text-align: center; font-style: italic; color: #56697A; font-size: 10pt; margin-bottom: 20px; }
        .section-title { font-size: 11pt; font-weight: bold; color: #5C1A2B; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #B8923F; padding-bottom: 4px; margin: 20px 0 12px; }
        .partie-label { font-weight: bold; color: #5C1A2B; margin: 12px 0 4px; }
        .champ { margin: 4px 0; font-size: 11pt; }
        .champ strong { color: #5C1A2B; }
        .article-title { font-weight: bold; color: #5C1A2B; margin: 16px 0 6px; font-size: 11pt; }
        .article-body { margin-left: 20px; font-size: 11pt; text-align: justify; }
        .signatures { margin-top: 40px; page-break-inside: avoid; }
        .sig-table { width: 100%; border-collapse: collapse; }
        .sig-table td { width: 50%; vertical-align: top; padding: 0 16px; text-align: center; }
        .sig-title { font-weight: bold; color: #5C1A2B; font-size: 11pt; }
        .sig-note { font-style: italic; font-size: 9pt; color: #56697A; margin: 4px 0 40px; }
        .sig-line { border-top: 1px solid #333; padding-top: 6px; font-size: 10pt; }
        .footer { position: fixed; bottom: 0; left: 0; right: 0; border-top: 1px solid #E8DDD5; padding: 6px 18mm; font-size: 8pt; color: #56697A; display: flex; justify-content: space-between; }
        @media print { .no-print { display: none; } }
        .print-btn { position: fixed; top: 20px; right: 20px; background: #5C1A2B; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-family: sans-serif; z-index: 999; }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer / Sauvegarder PDF</button>

      <div class="header">
        <div>
          <div class="agence">ImmobilierCI</div>
          <div class="sub">Agence Immobilière Agréée · ${data.bailleur_adresse} · ${data.bailleur_tel}</div>
        </div>
        <div style="text-align:right;font-size:9pt;color:#56697A;">Réf : BAIL-${Date.now().toString().slice(-6)}<br/>Émis le ${today}</div>
      </div>

      <h1>Contrat de Bail d'Habitation</h1>
      <p class="date-fait">Fait à Abidjan, le ${data.date}</p>

      <div class="section-title">Entre les soussignés</div>

      <div class="partie-label">LE BAILLEUR :</div>
      <div class="champ"><strong>Nom / Raison sociale :</strong> ${data.bailleur_nom}</div>
      <div class="champ"><strong>Adresse :</strong> ${data.bailleur_adresse}</div>
      <div class="champ"><strong>Téléphone :</strong> ${data.bailleur_tel}</div>

      <div class="partie-label" style="margin-top:16px;">LE LOCATAIRE :</div>
      <div class="champ"><strong>Nom et prénoms :</strong> ${data.locataire_nom}</div>
      <div class="champ"><strong>Téléphone :</strong> ${data.locataire_tel}</div>
      <div class="champ"><strong>CNI / Passeport N° :</strong> ${data.locataire_cni}</div>
      <div class="champ"><strong>Profession :</strong> ${data.locataire_profession}</div>
      <div class="champ"><strong>Employeur :</strong> ${data.locataire_employeur}</div>

      <p style="margin-top:16px;font-style:italic;color:#56697A;">Il a été convenu et arrêté ce qui suit :</p>

      <div class="section-title">Dispositions du contrat</div>

      <div class="article-title">Article 1 — Objet du bail</div>
      <div class="article-body">Le bailleur donne à bail au locataire qui accepte, le bien immobilier suivant : <strong>${data.bien_titre}</strong> — Type : ${data.bien_type} · Commune : ${data.bien_commune} · Adresse : ${data.bien_adresse} · Surface : ${data.bien_surface} m² · Chambres : ${data.bien_chambres}</div>

      <div class="article-title">Article 2 — Durée du bail</div>
      <div class="article-body">Le présent bail est consenti pour une durée d'un (1) an renouvelable par tacite reconduction, prenant effet le <strong>${data.date_entree}</strong> et se terminant le <strong>${data.date_fin}</strong>, sauf préavis de résiliation d'un (1) mois notifié par l'une ou l'autre des parties.</div>

      <div class="article-title">Article 3 — Loyer et modalités de paiement</div>
      <div class="article-body">Le loyer mensuel est fixé à <strong>${data.loyer}</strong>, payable d'avance le ${data.echeance} de chaque mois par ${data.mode_paiement}. Tout retard de paiement au-delà de 5 jours entraîne une pénalité de 5% du loyer mensuel.</div>

      <div class="article-title">Article 4 — Caution</div>
      <div class="article-body">Le locataire verse au bailleur une caution de <strong>${data.caution}</strong>, équivalente à deux (2) mois de loyer. Cette somme est remboursable à la fin du bail, déduction faite des éventuelles dégradations constatées lors de l'état des lieux de sortie.</div>

      <div class="article-title">Article 5 — Obligations du locataire</div>
      <div class="article-body">Le locataire s'engage à : occuper personnellement le logement et l'entretenir en bon état ; ne pas sous-louer sans accord écrit du bailleur ; respecter le voisinage et le règlement de copropriété ; souscrire une assurance habitation avant l'entrée dans les lieux ; restituer le bien dans l'état où il l'a reçu en fin de bail.</div>

      <div class="article-title">Article 6 — Obligations du bailleur</div>
      <div class="article-body">Le bailleur s'engage à : délivrer le logement en bon état d'usage et de réparation ; assurer la jouissance paisible du bien ; effectuer les grosses réparations nécessaires ; remettre une quittance de loyer à chaque paiement.</div>

      <div class="article-title">Article 7 — État des lieux</div>
      <div class="article-body">Un état des lieux contradictoire est établi à l'entrée et à la sortie du locataire. Il est signé par les deux parties et annexé au présent contrat.</div>

      <div class="article-title">Article 8 — Résiliation</div>
      <div class="article-body">Le présent bail peut être résilié par l'une ou l'autre des parties moyennant un préavis d'un (1) mois par lettre recommandée ou remise en main propre contre décharge. En cas de non-paiement du loyer pendant deux (2) mois consécutifs, le bail sera résilié de plein droit.</div>

      <div class="article-title">Article 9 — Litiges</div>
      <div class="article-body">En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, le tribunal compétent d'Abidjan sera saisi.</div>

      <div class="signatures">
        <div class="section-title">Signatures</div>
        <p style="font-style:italic;font-size:10pt;color:#56697A;">Fait en deux (2) exemplaires originaux, dont un remis à chaque partie.</p>
        <table class="sig-table">
          <tr>
            <td>
              <div class="sig-title">Le Bailleur</div>
              <div class="sig-note">(Signature + cachet)</div>
              <div class="sig-line">ImmobilierCI</div>
            </td>
            <td>
              <div class="sig-title">Le Locataire</div>
              <div class="sig-note">(Signature précédée de « Lu et approuvé »)</div>
              <div class="sig-line">${data.locataire_nom}</div>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  const w = window.open("", "_blank", "width=900,height=700");
  w.document.write(html);
  w.document.close();
}

// ── CONTRAT DE VENTE ─────────────────────────────────────────────────
export function genererContratVente({ vente, bien, client }) {
  const today = new Date().toLocaleDateString("fr-FR");
  const prixFinal = vente?.prixFinal || vente?.prixNegociation || vente?.prixAffiche || 0;
  const acompte = vente?.acompte || 0;
  const solde = prixFinal - acompte;
  const commission = vente?.tauxCommission || 5;
  const montantCommission = Math.round(prixFinal * commission / 100);

  const data = {
    date: today,
    acheteur_nom: vente?.acheteurNom || client?.nom || "___________________________",
    acheteur_tel: vente?.acheteurTel || client?.tel || "___________________________",
    acheteur_cni: client?.piece_identite || "___________________________",
    acheteur_profession: client?.profession || "___________________________",
    acheteur_employeur: client?.employeur || "___________________________",
    bien_titre: bien?.titre || "___________________________",
    bien_adresse: bien?.adresse || "___________________________",
    bien_commune: bien?.commune || "___________________________",
    bien_type: bien?.type === "vente" ? "Villa / Appartement" : bien?.type === "terrain" ? "Terrain" : "Bien immobilier",
    bien_surface: bien?.surface || "_____",
    titre_foncier: "___________________________",
    prix_vente: fmt(prixFinal),
    prix_lettres: nombreEnLettres(prixFinal),
    acompte: fmt(acompte),
    solde: fmt(solde),
    date_solde: fmtDate(vente?.dateActe),
    commission: commission,
    montant_commission: fmt(montantCommission),
    notaire: vente?.notaire || "___________________________",
    date_signature: fmtDate(vente?.dateActe || vente?.dateCompromis),
    charge_commission: "l'acheteur",
  };

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8"/>
      <title>Contrat de vente — ${data.acheteur_nom}</title>
      <style>
        @page { margin: 20mm 18mm; size: A4; }
        * { box-sizing: border-box; }
        body { font-family: 'Georgia', serif; font-size: 12pt; color: #333; line-height: 1.6; }
        .header { border-bottom: 2px solid #B8923F; padding-bottom: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        .header .agence { font-size: 16pt; font-weight: bold; color: #5C1A2B; }
        .header .sub { font-size: 9pt; color: #56697A; }
        h1 { text-align: center; font-size: 20pt; color: #5C1A2B; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 4px; }
        .date-fait { text-align: center; font-style: italic; color: #56697A; font-size: 10pt; margin-bottom: 20px; }
        .section-title { font-size: 11pt; font-weight: bold; color: #5C1A2B; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #B8923F; padding-bottom: 4px; margin: 20px 0 12px; }
        .partie-label { font-weight: bold; color: #5C1A2B; margin: 12px 0 4px; }
        .champ { margin: 4px 0; font-size: 11pt; }
        .champ strong { color: #5C1A2B; }
        .article-title { font-weight: bold; color: #5C1A2B; margin: 16px 0 6px; font-size: 11pt; }
        .article-body { margin-left: 20px; font-size: 11pt; text-align: justify; }
        .signatures { margin-top: 40px; page-break-inside: avoid; }
        .sig-table { width: 100%; border-collapse: collapse; }
        .sig-table td { width: 50%; vertical-align: top; padding: 0 16px; text-align: center; }
        .sig-title { font-weight: bold; color: #5C1A2B; font-size: 11pt; }
        .sig-note { font-style: italic; font-size: 9pt; color: #56697A; margin: 4px 0 40px; }
        .sig-line { border-top: 1px solid #333; padding-top: 6px; font-size: 10pt; }
        @media print { .no-print { display: none; } }
        .print-btn { position: fixed; top: 20px; right: 20px; background: #5C1A2B; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px; font-family: sans-serif; z-index: 999; }
      </style>
    </head>
    <body>
      <button class="print-btn no-print" onclick="window.print()">🖨️ Imprimer / Sauvegarder PDF</button>

      <div class="header">
        <div>
          <div class="agence">ImmobilierCI</div>
          <div class="sub">Agence Immobilière Agréée · ${AG.adresse || "Abidjan, Côte d'Ivoire"} · ${AG.tel1 || "+225 07 57 86 48 36"}</div>
        </div>
        <div style="text-align:right;font-size:9pt;color:#56697A;">Réf : VENTE-${Date.now().toString().slice(-6)}<br/>Émis le ${today}</div>
      </div>

      <h1>Contrat de Vente Immobilière</h1>
      <p class="date-fait">Fait à Abidjan, le ${data.date}</p>

      <div class="section-title">Entre les soussignés</div>

      <div class="partie-label">LE VENDEUR :</div>
      <div class="champ"><strong>Nom / Raison sociale :</strong> ImmobilierCI (Agence mandataire)</div>
      <div class="champ"><strong>Adresse :</strong> ${AG.adresse || "Abidjan, Côte d'Ivoire"}</div>
      <div class="champ"><strong>Téléphone :</strong> ${AG.tel1 || "+225 07 57 86 48 36"}</div>

      <div class="partie-label" style="margin-top:16px;">L'ACHETEUR :</div>
      <div class="champ"><strong>Nom et prénoms :</strong> ${data.acheteur_nom}</div>
      <div class="champ"><strong>Téléphone :</strong> ${data.acheteur_tel}</div>
      <div class="champ"><strong>CNI / Passeport N° :</strong> ${data.acheteur_cni}</div>
      <div class="champ"><strong>Profession :</strong> ${data.acheteur_profession}</div>
      <div class="champ"><strong>Employeur :</strong> ${data.acheteur_employeur}</div>

      <p style="margin-top:16px;font-style:italic;color:#56697A;">Il a été convenu et arrêté ce qui suit :</p>

      <div class="section-title">Dispositions du contrat</div>

      <div class="article-title">Article 1 — Désignation du bien</div>
      <div class="article-body">Le vendeur cède à l'acheteur qui accepte, le bien immobilier suivant : <strong>${data.bien_titre}</strong> — Type : ${data.bien_type} · Commune : ${data.bien_commune} · Adresse : ${data.bien_adresse} · Surface : ${data.bien_surface} m² · N° Titre Foncier : ${data.titre_foncier}</div>

      <div class="article-title">Article 2 — Prix de vente</div>
      <div class="article-body">Le présent bien est vendu au prix de <strong>${data.prix_vente}</strong> (${data.prix_lettres}), que l'acheteur s'engage à payer comme suit :<br/>• Acompte versé à la signature : <strong>${data.acompte}</strong><br/>• Solde restant dû : <strong>${data.solde}</strong>, payable au plus tard le ${data.date_solde}<br/>Tout retard entraîne des pénalités de 1% par mois de retard.</div>

      <div class="article-title">Article 3 — Commission d'agence</div>
      <div class="article-body">L'agence ImmobilierCI perçoit une commission de ${data.commission}% du prix de vente, soit <strong>${data.montant_commission}</strong>, à la charge de ${data.charge_commission}. Cette commission est exigible à la signature de l'acte définitif.</div>

      <div class="article-title">Article 4 — Titre de propriété et garanties</div>
      <div class="article-body">Le vendeur déclare être le propriétaire légitime du bien et garantit l'acheteur contre tout trouble de jouissance et éviction. Le titre foncier a été vérifié et est libre de toute hypothèque ou charge non déclarée.</div>

      <div class="article-title">Article 5 — Transfert de propriété</div>
      <div class="article-body">Le transfert de propriété est effectif à la signature de l'acte définitif de vente et après paiement intégral du prix convenu.</div>

      <div class="article-title">Article 6 — Acte notarié</div>
      <div class="article-body">Les parties s'engagent à signer l'acte définitif de vente devant Maître <strong>${data.notaire}</strong>, Notaire, au plus tard le ${data.date_signature}. Les frais de notaire sont à la charge exclusive de l'acheteur.</div>

      <div class="article-title">Article 7 — Conditions suspensives</div>
      <div class="article-body">La présente vente est conclue sous conditions suspensives : obtention du financement bancaire dans un délai de 60 jours (le cas échéant) et confirmation du titre foncier libre de charges. En cas de non-réalisation, l'acompte est intégralement restitué à l'acheteur.</div>

      <div class="article-title">Article 8 — Clause de dédit</div>
      <div class="article-body">Si l'acheteur renonce sans motif valable, l'acompte reste acquis au vendeur. Si le vendeur renonce, il restitue le double de l'acompte à l'acheteur.</div>

      <div class="article-title">Article 9 — Litiges</div>
      <div class="article-body">En cas de litige, les parties s'engagent à rechercher une solution amiable dans un délai de 30 jours. À défaut, le tribunal compétent d'Abidjan sera saisi.</div>

      <div class="signatures">
        <div class="section-title">Signatures</div>
        <p style="font-style:italic;font-size:10pt;color:#56697A;">Fait en deux (2) exemplaires originaux, dont un remis à chaque partie.</p>
        <table class="sig-table">
          <tr>
            <td>
              <div class="sig-title">Le Vendeur</div>
              <div class="sig-note">(Signature + cachet agence)</div>
              <div class="sig-line">ImmobilierCI</div>
            </td>
            <td>
              <div class="sig-title">L'Acheteur</div>
              <div class="sig-note">(Signature précédée de « Lu et approuvé »)</div>
              <div class="sig-line">${data.acheteur_nom}</div>
            </td>
          </tr>
        </table>
        <div style="margin-top:32px;">
          <div style="font-weight:bold;color:#5C1A2B;margin-bottom:8px;">Signature du Notaire : Maître ${data.notaire}</div>
          <div style="width:280px;margin:0 auto;border-top:1px solid #333;padding-top:8px;text-align:center;font-style:italic;font-size:10pt;color:#56697A;">Cachet et signature du Notaire</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const w = window.open("", "_blank", "width=900,height=700");
  w.document.write(html);
  w.document.close();
}

