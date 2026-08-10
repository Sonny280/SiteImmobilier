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
  const w = window.open("","_blank","width=800,height=900");
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
  const num = `QUI-${(loyer.id||"").toString().padStart(4,"0")}-${(loyer.mois||"").replace("-","")}`;
  const moisFmt = new Date((loyer.mois||"2025-01")+"-01").toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
  const html = `
    <div class="header">
      <div class="logo-block">
        ${AG.logo
          ? `<img src="${logoUrl}" alt="ImmobilierCI" style="height:60px;max-width:200px;object-fit:contain;margin-bottom:8px;display:block;"/>`
          : `<div class="name">ImmobilierCI</div>`
        }
        <div class="tagline">${AG.slogan}</div>
        <div class="contact">
          ${AG.tel1}${AG.tel2 && AG.tel2 !== AG.tel1 ? ' · ' + AG.tel2 : ''}<br/>
          ${AG.email}<br/>
          ${AG.adresse}
        </div>
      </div>
      <div style="text-align:right;">
        <div class="badge">QUITTANCE DE LOYER<div class="ref">${num}</div></div>
        <div style="font-size:12px;color:#56697a;margin-top:8px;">Émise le ${today()}</div>
      </div>
    </div>

    <div class="amount-box">
      <div class="label">Loyer du mois de ${moisFmt}</div>
      <div class="montant">${fmt(loyer.montant)} FCFA</div>
      <div class="en-lettres">Payé le ${loyer.datePaiement||today()} par ${(loyer.modePaiement||"virement").replace("_"," ")}</div>
    </div>
    <div class="gold-bar"></div>

    <div class="section">
      <div class="section-title">Locataire</div>
      <div class="grid">
        <div class="field"><div class="label">Nom complet</div><div class="value">${client?.nom||"—"}</div></div>
        <div class="field"><div class="label">Téléphone</div><div class="value">${client?.tel||"—"}</div></div>
        <div class="field"><div class="label">Profession</div><div class="value">${client?.profession||"—"}</div></div>
        <div class="field"><div class="label">Employeur</div><div class="value">${client?.employeur||"—"}</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Bien loué</div>
      <div class="grid">
        <div class="field"><div class="label">Désignation</div><div class="value">${bien?.titre||loyer.bienTitre||"—"}</div></div>
        <div class="field"><div class="label">Référence</div><div class="value">${bien?.ref||"—"}</div></div>
        <div class="field"><div class="label">Localisation</div><div class="value">${bien?.quartier||"—"}, ${bien?.commune||"—"}</div></div>
        <div class="field"><div class="label">Loyer mensuel</div><div class="value">${fmt(loyer.montant)} FCFA / mois</div></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Détail du paiement</div>
      <div class="grid">
        <div class="field"><div class="label">Période</div><div class="value">${moisFmt}</div></div>
        <div class="field"><div class="label">Date de paiement</div><div class="value">${loyer.datePaiement||today()}</div></div>
        <div class="field"><div class="label">Mode de paiement</div><div class="value">${(loyer.modePaiement||"virement").replace("_"," ")}</div></div>
        <div class="field"><div class="label">Montant reçu</div><div class="value" style="color:#5c1a2b;font-size:18px;">${fmt(loyer.montant)} FCFA</div></div>
      </div>
    </div>

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-space"></div>
        <div class="sig-label">Signature du locataire</div>
        <div style="font-size:12px;color:#56697a;margin-top:4px;">${client?.nom||""}</div>
      </div>
      <div class="sig-box">
        <div class="sig-space"></div>
        <div class="sig-label">Cachet & Signature ImmobilierCI</div>
        <div style="font-size:12px;color:#56697a;margin-top:4px;">Kouassi Atse Charles — Directeur</div>
      </div>
    </div>

    <div class="footer">
      ImmobilierCI — Agence Immobilière Agréée · ${AG.adresse} · ${AG.tel1} · ${AG.email}<br/>
      Ce document tient lieu de quittance officielle de loyer conformément à la loi ivoirienne.
    </div>`;
  imprimerRecu(html);
}

// ── Reçu de vente / acompte ──────────────────────────────────
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

