// config/email.js — ImmobilierCI
const nodemailer = require("nodemailer");
let _t = null;
function getT() {
  if (_t) return _t;
  if (!process.env.SMTP_USER) return null;
  _t = nodemailer.createTransport({ host:process.env.SMTP_HOST||"smtp.gmail.com", port:+process.env.SMTP_PORT||587, secure:false, auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS} });
  return _t;
}
const AG = {
  name:  process.env.AGENCY_NAME    || "ImmobilierCI",
  email: process.env.AGENCY_EMAIL   || "contact@immobilierci.ci",
  wa:    process.env.AGENCY_WHATSAPP|| "+2250757864836",
  tel:   process.env.AGENCY_TEL     || "+2252722295708",
  slogan:"Construisons votre sécurité, pierre après pierre.",
};
const fmt  = n => new Intl.NumberFormat("fr-CI").format(n||0);
const FROM = () => `"${AG.name}" <${process.env.SMTP_USER||AG.email}>`;
const css  = "font-family:system-ui,sans-serif;max-width:580px;margin:0 auto";
const hdr  = (bg,txt) => `<div style="background:${bg};color:white;padding:22px 28px;border-radius:12px 12px 0 0"><h2 style="margin:0;font-size:19px;font-weight:700">${txt}</h2><p style="margin:6px 0 0;font-size:12px;opacity:.8">${AG.slogan}</p></div>`;
const bdy  = c => `<div style="padding:28px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">${c}</div>`;
const ftr  = () => `<div style="text-align:center;padding:20px;font-size:11px;color:#9ca3af">${AG.name} · ${AG.tel} · <a href="https://wa.me/${AG.wa.replace(/\D/g,'')}" style="color:#059669">WhatsApp</a></div>`;

async function sendNotifAgence(demande, bien) {
  const t=getT(); if(!t) return;
  await t.sendMail({ from:FROM(), to:AG.email, subject:`🏠 Nouvelle demande — ${demande.nom}`,
    html:`<div style="${css}">${hdr("#1e3a5f","ImmobilierCI — Nouvelle demande")}${bdy(`
      <p><b>Nom :</b> ${demande.nom}</p>
      <p><b>Tél :</b> <a href="tel:${demande.tel}">${demande.tel}</a> &nbsp;|&nbsp; <b>Email :</b> ${demande.email||"—"}</p>
      <p><b>Intérêt :</b> ${demande.interet} &nbsp;|&nbsp; <b>Budget :</b> ${demande.budget||"—"}</p>
      ${bien?`<p><b>Bien :</b> ${bien.titre} (${bien.ref})</p>`:""}
      <p><b>Message :</b> ${demande.message||"—"}</p>
      <div style="margin-top:20px;display:flex;gap:12px">
        <a href="https://wa.me/${(demande.tel||"").replace(/\D/g,"")}" style="background:#25D366;color:white;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600">💬 WhatsApp</a>
        <a href="tel:${demande.tel}" style="background:#1e3a5f;color:white;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600">📞 Appeler</a>
      </div>
    `)}${ftr()}</div>`
  });
}

async function sendConfirmationVisiteur(demande) {
  const t=getT(); if(!t||!demande.email) return;
  await t.sendMail({ from:FROM(), to:demande.email, subject:`✅ Votre demande a bien été reçue — ImmobilierCI`,
    html:`<div style="${css}">${hdr("#1e3a5f","Confirmation de votre demande")}${bdy(`
      <p>Bonjour <b>${demande.nom}</b>,</p>
      <p>Nous avons bien reçu votre demande et notre équipe vous contactera <b>sous 24h</b>.</p>
      <p style="color:#6b7280">Intérêt : ${demande.interet} &nbsp;|&nbsp; Budget : ${demande.budget||"—"}</p>
      <a href="https://wa.me/${AG.wa.replace(/\D/g,"")}" style="display:inline-block;margin-top:16px;background:#25D366;color:white;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600">💬 Nous écrire sur WhatsApp</a>
    `)}${ftr()}</div>`
  });
}

async function sendQuittance(loyer, client, bien) {
  const t=getT(); if(!t||!client?.email) return;
  const moisFmt = new Date((loyer.mois||"2025-01")+"-01").toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
  await t.sendMail({ from:FROM(), to:client.email, subject:`🏠 Quittance de loyer — ${moisFmt} — ImmobilierCI`,
    html:`<div style="${css}">${hdr("#1e3a5f",`Quittance de loyer — ${moisFmt}`)}${bdy(`
      <p>Bonjour <b>${client.nom}</b>,</p>
      <p>Nous confirmons la réception de votre loyer pour le mois de <b>${moisFmt}</b>.</p>
      <table style="width:100%;border-collapse:collapse;margin:18px 0">
        <tr style="background:#f8fafc"><td style="padding:11px 14px;border:1px solid #e5e7eb"><b>Bien</b></td><td style="padding:11px 14px;border:1px solid #e5e7eb">${bien?.titre||"—"}</td></tr>
        <tr><td style="padding:11px 14px;border:1px solid #e5e7eb"><b>Période</b></td><td style="padding:11px 14px;border:1px solid #e5e7eb">${moisFmt}</td></tr>
        <tr style="background:#f8fafc"><td style="padding:11px 14px;border:1px solid #e5e7eb"><b>Date de paiement</b></td><td style="padding:11px 14px;border:1px solid #e5e7eb">${loyer.datePaiement||"—"}</td></tr>
        <tr style="background:#f0fdf4"><td style="padding:11px 14px;border:1px solid #e5e7eb;font-weight:700">Montant payé</td><td style="padding:11px 14px;border:1px solid #e5e7eb;font-weight:800;color:#059669;font-size:16px">${fmt(loyer.montantRecu||loyer.montant)} FCFA</td></tr>
      </table>
      <p style="font-size:12px;color:#9ca3af">Ce document vaut quittance de loyer. Conservez-le précieusement. — ${AG.name}</p>
    `)}${ftr()}</div>`
  });
}

async function sendRelanceLoyer(loyer, client, bien, numRelance=1) {
  const t=getT(); if(!t||!client?.email) return;
  const moisFmt = new Date((loyer.mois||"2025-01")+"-01").toLocaleDateString("fr-FR",{month:"long",year:"numeric"});
  const niveaux = ["","Rappel amiable","Relance formelle","Mise en demeure"];
  const niveau  = niveaux[Math.min(numRelance,3)];
  await t.sendMail({ from:FROM(), to:client.email, subject:`⚠️ Loyer en attente — ${moisFmt} [${niveau}] — ImmobilierCI`,
    html:`<div style="${css}">${hdr("#dc2626",`⚠️ ${niveau} — Loyer en attente`)}${bdy(`
      <p>Bonjour <b>${client.nom}</b>,</p>
      <p>Sauf erreur de notre part, votre loyer du mois de <b>${moisFmt}</b> n'a pas encore été réglé.</p>
      <table style="width:100%;border-collapse:collapse;margin:18px 0">
        <tr style="background:#fef2f2"><td style="padding:11px 14px;border:1px solid #fecaca"><b>Bien</b></td><td style="padding:11px 14px;border:1px solid #fecaca">${bien?.titre||"—"}</td></tr>
        <tr><td style="padding:11px 14px;border:1px solid #fecaca"><b>Loyer dû</b></td><td style="padding:11px 14px;border:1px solid #fecaca;font-weight:700;color:#dc2626">${fmt(loyer.montant)} FCFA</td></tr>
        ${(loyer.joursRetard||0)>0?`<tr style="background:#fef2f2"><td style="padding:11px 14px;border:1px solid #fecaca;color:#dc2626"><b>Retard</b></td><td style="padding:11px 14px;border:1px solid #fecaca;color:#dc2626">${loyer.joursRetard} jour(s)</td></tr>`:""}
      </table>
      <p>Merci de régulariser votre situation dans les plus brefs délais.</p>
      <a href="https://wa.me/${(client.whatsapp||client.tel||"").replace(/\D/g,"")}" style="display:inline-block;margin-top:16px;background:#25D366;color:white;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600">💬 Nous contacter</a>
    `)}${ftr()}</div>`
  });
}

module.exports = { sendNotifAgence, sendConfirmationVisiteur, sendQuittance, sendRelanceLoyer };
