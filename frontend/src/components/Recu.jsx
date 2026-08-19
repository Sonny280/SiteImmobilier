// components/Recu.jsx — Génération de reçus PDF imprimables
import { AG, API } from "../utils.js";

// Récupère le logo depuis l'API settings (Cloudinary)
async function getLogoUrl() {
  try {
    const r = await fetch(`${API}/settings`);
    const d = await r.json();
    return d.logo || "";
  } catch { return ""; }
}

const fmt = n => new Intl.NumberFormat("fr-CI").format(Math.round(n||0));
const today = () => new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"});

// Génère le HTML du reçu et l'ouvre dans une nouvelle fenêtre pour impression/PDF
export function imprimerRecu(html) {
  const w = window.open("","_blank","width=620,height=750");
  w.document.write(`<!DOCTYPE html><html lang="fr"><head>
    <meta charset="UTF-8"/>
    <title>Reçu ImmobilierCI</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#0d1b2e;background:white;padding:40px;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:3px solid #5c1a2b;}
      .logo-block .name{font-size:24px;font-weight:900;color:#5c1a2b;letter-spacing:-0.02em;}
      .logo-block .tagline{font-size:11px;color:#56697a;margin-top:3px;}
      .logo-block .contact{font-size:11px;color:#56697a;margin-top:8px;line-height:1.7;}
      .badge{background:#5c1a2b;color:white;padding:8px 20px;border-radius:8px;font-size:13px;font-weight:700;text-align:right;}
      .badge .ref{font-size:11px;color:rgba(255,255,255,0.65);margin-top:3px;}
      .section{margin-bottom:24px;}
      .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:#56697a;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e8eef8;}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;}
      .field .label{font-size:10px;color:#56697a;text-transform:uppercase;letter-spacing:0.08em;}
      .field .value{font-size:14px;font-weight:600;color:#0d1b2e;margin-top:2px;}
      .amount-box{background:#f6f8fc;border:2px solid #5c1a2b;border-radius:12px;padding:20px;text-align:center;margin:24px 0;}
      .amount-box .label{font-size:12px;color:#56697a;text-transform:uppercase;letter-spacing:0.1em;}
      .amount-box .montant{font-size:36px;font-weight:900;color:#5c1a2b;margin:8px 0;}
      .amount-box .en-lettres{font-size:13px;color:#56697a;font-style:italic;}
      .gold-bar{height:4px;background:linear-gradient(90deg,#c29437,#e8c96a);border-radius:2px;margin:24px 0;}
      .signatures{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:40px;}
      .sig-box{border-top:1.5px solid #5c1a2b;padding-top:10px;text-align:center;}
      .sig-box .sig-label{font-size:11px;font-weight:700;text-transform:uppercase;color:#56697a;letter-spacing:0.08em;}
      .sig-space{height:60px;}
      .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e8eef8;font-size:10px;color:#aab4c4;text-align:center;}
      @media print{body{padding:20px;}.no-print{display:none!important;}}
    </style>
  </head><body>
    ${html}
    <div class="no-print" style="margin-top:32px;text-align:center;">
      <button onclick="window.print()" style="padding:12px 32px;background:#5c1a2b;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-right:8px;">🖨️ Imprimer / Enregistrer PDF</button>
      <button onclick="window.close()" style="padding:12px 20px;background:white;color:#5c1a2b;border:1.5px solid #5c1a2b;border-radius:8px;font-size:14px;cursor:pointer;">Fermer</button>
    </div>
  </body></html>`);
  w.document.close();
}

// ── Reçu de loyer (quittance) ────────────────────────────────
export async function genererQuittanceLoyer({ loyer, client, bien }) {
  const logoUrl = await getLogoUrl();
  const today = new Date().toLocaleDateString("fr-FR");
  const num = `QT-${new Date().getFullYear()}-${String(loyer?.id||Date.now().toString().slice(-4)).padStart(4,"0")}`;

  function nombreEnLettres(n) {
    if (!n || isNaN(n)) return "___________________________";
    const u = ["","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
    const d = ["","","vingt","trente","quarante","cinquante","soixante","soixante","quatre-vingt","quatre-vingt"];
    function conv(nb) {
      if (nb === 0) return "zéro";
      if (nb < 20) return u[nb];
      if (nb < 100) { const dd=Math.floor(nb/10),ud=nb%10; if(dd===7||dd===9) return d[dd]+(ud===1?"-et-":"-")+u[10+ud]; return d[dd]+(ud===1&&dd!==8?"-et-":ud?"-":"")+(ud?u[ud]:(dd===8?"s":"")); }
      if (nb < 1000) { const c=Math.floor(nb/100),r=nb%100; return (c>1?u[c]+"-cent":"cent")+(r?(c>1?"s":"")+"-"+conv(r):(c>1?"s":"")); }
      if (nb < 1000000) { const m=Math.floor(nb/1000),r=nb%1000; return (m>1?conv(m)+"-mille":"mille")+(r?"-"+conv(r):""); }
      const m=Math.floor(nb/1000000),r=nb%1000000; return conv(m)+" million"+(m>1?"s":"")+(r?"-"+conv(r):"");
    }
    return conv(Math.round(n)) + " francs CFA";
  }

  const montant = loyer?.montantRecu || loyer?.montant || 0;
  const fmtN = n => n ? new Intl.NumberFormat("fr-CI").format(n) : "0";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Quittance de loyer — ${client?.nom||""}</title>
  <style>
    @page { size: A5 landscape; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #222; background: white; }
    .wrap { border: 2px solid #1a3a6b; padding: 14px 18px; min-height: 180px; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #1a3a6b; padding-bottom: 10px; margin-bottom: 12px; }
    .logo-zone { display: flex; align-items: center; gap: 12px; }
    .logo-zone img { height: 55px; max-width: 130px; object-fit: contain; }
    .agence-info { font-size: 9pt; color: #333; line-height: 1.6; }
    .agence-name { font-size: 14pt; font-weight: 900; color: #5c1a2b; letter-spacing: -0.02em; margin-bottom: 2px; }
    .title-zone { text-align: right; }
    .titre { font-size: 18pt; font-weight: 900; color: #1a3a6b; text-transform: uppercase; letter-spacing: 1px; }
    .num { font-size: 10pt; color: #333; margin-top: 4px; }
    .date-bpf { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 10pt; }
    .bpf { font-size: 14pt; font-weight: 900; color: #1a3a6b; }
    .row { display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px; font-size: 10.5pt; }
    .row-label { color: #1a3a6b; font-weight: 600; white-space: nowrap; min-width: 120px; }
    .row-value { border-bottom: 1px dotted #999; flex: 1; font-weight: 700; padding-bottom: 1px; }
    .row-value.big { font-size: 13pt; text-align: center; background: #e8f0fe; padding: 3px 10px; border: none; border-radius: 4px; }
    .row-value.highlight { background: #e8f0fe; text-align: center; padding: 3px 8px; border: none; font-size: 11pt; }
    .footer-text { font-size: 8pt; color: #555; margin-top: 14px; border-top: 1px solid #ccc; padding-top: 6px; font-style: italic; }
    .sig { display: flex; justify-content: flex-end; margin-top: 12px; }
    .sig-box { text-align: center; min-width: 160px; }
    .sig-label { font-size: 9pt; color: #555; }
    .sig-line { border-top: 1px solid #333; margin-top: 36px; padding-top: 4px; font-size: 9pt; color: #333; }
    .print-btn { position: fixed; top: 12px; right: 12px; background: #5c1a2b; color: white; border: none; padding: 8px 18px; border-radius: 7px; cursor: pointer; font-size: 12px; font-family: Arial; }
    @media print { .print-btn { display: none; } }
    .dont { font-weight: 900; color: #1a3a6b; }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">🖨️ Imprimer</button>
  <div class="wrap">
    <!-- En-tête -->
    <div class="header">
      <div class="logo-zone">
        ${logoUrl
          ? `<img src="${logoUrl}" alt="Logo"/>`
          : `<div style="width:55px;height:55px;background:#5c1a2b;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#b8923f;font-weight:900;font-size:16px">IC</div>`
        }
        <div>
          <div class="agence-name">ImmobilierCI</div>
          <div class="agence-info">
            Agence Immobilière Agréée<br/>
            ${AG.adresse||"Abidjan, Côte d'Ivoire"}<br/>
            ${AG.tel1||""} ${AG.tel2?" · "+AG.tel2:""}<br/>
            ${AG.email||"contact@immobilierci.ci"}
          </div>
        </div>
      </div>
      <div class="title-zone">
        <div class="titre">Quittance de Loyer</div>
        <div class="num">N° ${num}</div>
      </div>
    </div>

    <!-- Date + BPF -->
    <div class="date-bpf">
      <div>Date : <strong>${loyer?.datePaiement ? new Date(loyer.datePaiement).toLocaleDateString("fr-FR") : today}</strong></div>
      <div>BPF : <span class="bpf">${fmtN(montant)} Fcfa</span></div>
    </div>

    <!-- Reçu de -->
    <div class="row">
      <span class="row-label">Reçu de M.</span>
      <span class="row-value">${client?.nom||"___________________________"}</span>
    </div>

    <!-- Somme en lettres -->
    <div class="row">
      <span class="row-label" style="line-height:1.3">La somme de<br/><small>(en lettres)</small></span>
      <span class="row-value big">${nombreEnLettres(montant)}</span>
    </div>

    <!-- Pour loyer -->
    <div class="row">
      <span class="row-label">Pour le loyer de</span>
      <span class="row-value highlight">${loyer?.mois||"___________"}</span>
      <span style="white-space:nowrap;font-size:10.5pt"> des locaux qu'il occupe dans</span>
    </div>

    <!-- Adresse bien -->
    <div class="row">
      <span class="row-label">La maison située</span>
      <span class="row-value">${bien?.adresse||bien?.commune||"___________________________"}</span>
    </div>

    <!-- Le dit / Commençant -->
    <div class="row">
      <span class="row-label">Le dit</span>
      <span class="row-value">${bien?.titre||"_______________"}</span>
      <span style="white-space:nowrap;font-size:10.5pt"> commençant le </span>
      <span class="row-value">${client?.dateEntree||client?.date_entree||"___________"}</span>
    </div>

    <!-- Mode paiement -->
    <div class="row">
      <span class="row-label">Mode de paiement</span>
      <span class="row-value">${(loyer?.modePaiement||"virement").replace("_"," ")}</span>
      <span style="margin-left:20px;font-size:11pt;" class="dont">DONT QUITTANCE.</span>
    </div>

    <!-- Signature -->
    <div class="sig">
      <div class="sig-box">
        <div class="sig-label">Le Bailleur / ImmobilierCI</div>
        <div class="sig-line">Signature + Cachet</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  imprimerRecu(html);
}



export async function genererRecuVente({ vente, paiement, bien }) {
  const logoUrl = await getLogoUrl();
  const num = `RCV-${(vente.id||"").toString().padStart(4,"0")}-${(paiement?.id||"").toString().padStart(4,"0")}`;
  const typePai = { acompte:"Acompte", solde:"Solde final", frais:"Frais d'agence", autre:"Autre versement" };
  const html = `
    <div class="header">
      <div class="logo-block">
        ${AG.logo
          ? `<img src="${logoUrl}" alt="ImmobilierCI" style="height:60px;max-width:200px;object-fit:contain;margin-bottom:8px;display:block;"/>`
          : `<div class="name">ImmobilierCI</div>`
        }
        <div class="tagline">${AG.slogan}</div>
        <div class="contact">${AG.tel1}${AG.tel2 && AG.tel2 !== AG.tel1 ? ' · ' + AG.tel2 : ''}<br/>${AG.email}<br/>${AG.adresse}</div>
      </div>
      <div style="text-align:right;">
        <div class="badge">REÇU DE PAIEMENT<div class="ref">${num}</div></div>
        <div style="font-size:12px;color:#56697a;margin-top:8px;">Émis le ${today()}</div>
      </div>
    </div>

    <div class="amount-box">
      <div class="label">${typePai[paiement?.type]||"Versement"} — Dossier ${vente.ref||""}</div>
      <div class="montant">${fmt(paiement?.montant)} FCFA</div>
      <div class="en-lettres">Reçu le ${paiement?.date||today()} par ${(paiement?.modePaiement||"virement").replace("_"," ")}
        ${paiement?.reference ? ` · Réf. ${paiement.reference}` : ""}
      </div>
    </div>
    <div class="gold-bar"></div>

    <div class="section">
      <div class="section-title">Acheteur</div>
      <div class="grid">
        <div class="field"><div class="label">Nom complet</div><div class="value">${vente.acheteurNom||"—"}</div></div>
        <div class="field"><div class="label">Téléphone</div><div class="value">${vente.acheteurTel||"—"}</div></div>
        <div class="field"><div class="label">Email</div><div class="value">${vente.acheteurEmail||"—"}</div></div>
        <div class="field"><div class="label">Mode de financement</div><div class="value">${vente.modeFinancement||"—"}${vente.banque?" · "+vente.banque:""}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Bien concerné</div>
      <div class="grid">
        <div class="field"><div class="label">Désignation</div><div class="value">${bien?.titre||"—"}</div></div>
        <div class="field"><div class="label">Référence</div><div class="value">${bien?.ref||vente.ref||"—"}</div></div>
        <div class="field"><div class="label">Localisation</div><div class="value">${bien?.quartier||"—"}, ${bien?.commune||"—"}</div></div>
        <div class="field"><div class="label">Prix de vente</div><div class="value">${fmt(vente.prixFinal||vente.prixAffiche)} FCFA</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Récapitulatif des versements</div>
      <div class="grid">
        <div class="field"><div class="label">Prix total</div><div class="value">${fmt(vente.prixFinal||vente.prixAffiche)} FCFA</div></div>
        <div class="field"><div class="label">Ce versement</div><div class="value" style="color:#5c1a2b;font-size:18px;">${fmt(paiement?.montant)} FCFA</div></div>
        <div class="field"><div class="label">Total encaissé</div><div class="value" style="color:#15803d;">${fmt(vente.totalPaye||0)} FCFA</div></div>
        <div class="field"><div class="label">Reste à payer</div><div class="value" style="color:${(vente.resteAPayer||0)>0?"#dc2626":"#15803d"};">${fmt(vente.resteAPayer||0)} FCFA</div></div>
      </div>
    </div>

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-space"></div>
        <div class="sig-label">Signature de l'acheteur</div>
        <div style="font-size:12px;color:#56697a;margin-top:4px;">${vente.acheteurNom||""}</div>
      </div>
      <div class="sig-box">
        <div class="sig-space"></div>
        <div class="sig-label">Cachet & Signature ImmobilierCI</div>
        <div style="font-size:12px;color:#56697a;margin-top:4px;">Kouassi Atse Charles — Directeur</div>
      </div>
    </div>

    <div class="footer">
      ImmobilierCI — Agence Immobilière Agréée · ${AG.adresse} · ${AG.tel1} · ${AG.email}<br/>
      Ce reçu est un document officiel. Conservez-le précieusement.
    </div>`;
  imprimerRecu(html);
}

