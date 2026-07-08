// config/whatsapp.js — Notification WhatsApp via CallMeBot (gratuit)
// ─────────────────────────────────────────────────────────────────────
// CallMeBot est un service GRATUIT qui envoie des messages WhatsApp
// via une simple requête HTTP. Aucune API payante nécessaire.
//
// ACTIVATION (1 seule fois) :
// 1. Ajoutez le numéro +34 644 59 87 50 dans vos contacts WhatsApp
// 2. Envoyez-lui le message : "I allow callmebot to send me messages"
// 3. Vous recevrez votre apikey en réponse (ex: 123456)
// 4. Mettez apikey dans votre .env : CALLMEBOT_APIKEY=123456

const https = require("https");

const APIKEY    = process.env.CALLMEBOT_APIKEY;
const WA_NUM    = (process.env.AGENCY_WHATSAPP||"").replace(/\D/g,"");

/**
 * Envoie un message WhatsApp via CallMeBot
 * @param {string} message - Texte du message (max 1000 caractères)
 */
async function sendWhatsApp(message) {
  if (!APIKEY || !WA_NUM) {
    console.log("ℹ️  WhatsApp non configuré — ajoutez CALLMEBOT_APIKEY dans .env");
    return false;
  }
  const encoded = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${WA_NUM}&text=${encoded}&apikey=${APIKEY}`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        const ok = res.statusCode === 200;
        if (ok) console.log("✅ WhatsApp envoyé");
        else    console.error("❌ WhatsApp erreur:", res.statusCode, data);
        resolve(ok);
      });
    }).on("error", (err) => {
      console.error("❌ WhatsApp erreur réseau:", err.message);
      resolve(false);
    });
  });
}

/**
 * Notification nouvelle demande client
 */
async function notifNouvellesDemande(demande, bien) {
  const typeLabel = {
    location:"Location", meuble:"Meublé", vente:"Vente",
    terrain:"Terrain", gestion:"Gestion locative", estimation:"Estimation", autre:"Autre"
  };
  const msg = [
    "🏠 *ImmobilierCI — Nouvelle demande*",
    "",
    `👤 *Nom :* ${demande.nom}`,
    `📞 *Tél :* ${demande.tel}`,
    demande.email ? `✉️ *Email :* ${demande.email}` : null,
    `🔍 *Intérêt :* ${typeLabel[demande.interet]||demande.interet}`,
    demande.budget ? `💰 *Budget :* ${demande.budget}` : null,
    bien ? `🏢 *Bien :* ${bien.titre} (${bien.ref})` : null,
    demande.message ? `💬 *Message :*\n${demande.message.slice(0,200)}` : null,
    "",
    `⏰ Reçue le ${new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"})}`,
  ].filter(Boolean).join("\n");
  return sendWhatsApp(msg);
}

/**
 * Notification loyer payé
 */
async function notifLoyerPaye(loyer, client, bien) {
  const msg = [
    "💰 *ImmobilierCI — Loyer encaissé*",
    "",
    `👤 *Locataire :* ${client?.nom||"—"}`,
    `🏢 *Bien :* ${bien?.titre||"—"}`,
    `📅 *Mois :* ${loyer.mois}`,
    `💵 *Montant :* ${new Intl.NumberFormat("fr-CI").format(loyer.montantRecu||loyer.montant)} FCFA`,
    `💳 *Mode :* ${(loyer.modePaiement||"").replace("_"," ")}`,
    `✅ Payé le ${loyer.datePaiement||new Date().toLocaleDateString("fr-FR")}`,
  ].filter(Boolean).join("\n");
  return sendWhatsApp(msg);
}

/**
 * Notification nouvelle visite planifiée
 */
async function notifNouvelleVisite(visite, bien) {
  const msg = [
    "📅 *ImmobilierCI — Visite planifiée*",
    "",
    `👤 *Visiteur :* ${visite.nom}`,
    `📞 *Tél :* ${visite.tel||"—"}`,
    `🏢 *Bien :* ${bien?.titre||visite.bienTitre||"—"}`,
    `📆 *Date :* ${visite.date}${visite.heure?" à "+visite.heure:""}`,
    visite.notes ? `📝 *Notes :* ${visite.notes}` : null,
  ].filter(Boolean).join("\n");
  return sendWhatsApp(msg);
}

module.exports = { sendWhatsApp, notifNouvellesDemande, notifLoyerPaye, notifNouvelleVisite };
