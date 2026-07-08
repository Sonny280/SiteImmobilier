// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const DEFAULT_SECRET = "sei_secret_2025";
const SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

// Refuse de démarrer avec le secret par défaut en production — ce secret est
// visible dans le code source public, l'utiliser permettrait de forger un
// token superadmin valide sans connaître aucun mot de passe.
if (process.env.NODE_ENV === "production" && SECRET === DEFAULT_SECRET) {
  console.error("❌ ERREUR CRITIQUE : JWT_SECRET n'est pas défini en production.");
  console.error("   Définissez une valeur unique et secrète dans backend/.env, par exemple :");
  console.error("   JWT_SECRET=" + require("crypto").randomBytes(32).toString("hex"));
  process.exit(1);
}

exports.auth = (req, res, next) => {
  // Priorité au cookie HttpOnly (nouvelle méthode, plus sécurisée).
  // Fallback sur le header Authorization pour la compatibilité avec
  // les appels API directs (Postman, scripts tiers).
  const fromCookie = req.cookies?.li_session;
  const fromHeader = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;
  const token = fromCookie || fromHeader;
  if (!token) return res.status(401).json({ error: "Non authentifié" });
  try { req.user = jwt.verify(token, SECRET); next(); }
  catch { res.status(401).json({ error: "Session expirée, veuillez vous reconnecter" }); }
};

// ── Permissions par rôle ──────────────────────────────────────────
// superadmin : accès total
// admin      : accès total sauf gestion des utilisateurs
// commercial : biens, clients, demandes, visites, contrats (lecture/écriture) — pas loyers/ventes financiers
// comptable  : loyers, ventes (lecture/écriture) — biens/clients en lecture seule
// lecture    : lecture seule partout, aucune écriture
const ROLE_LEVEL = { superadmin: 4, admin: 3, commercial: 2, comptable: 2, lecture: 1 };

// requireRole(["admin","superadmin"]) — autorise seulement ces rôles précis
exports.requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Vous n'avez pas la permission d'effectuer cette action." });
  }
  next();
};

// requireWrite() — bloque toute écriture (POST/PUT/DELETE) pour le rôle "lecture"
exports.requireWrite = (req, res, next) => {
  if (req.user?.role === "lecture") {
    return res.status(403).json({ error: "Votre compte est en lecture seule. Aucune modification n'est autorisée." });
  }
  next();
};

// requireModule(moduleName) — vérifie l'accès métier par module pour commercial/comptable
const MODULE_ACCESS = {
  // module: rôles autorisés en écriture (superadmin/admin toujours inclus)
  biens:        ["commercial"],
  clients:      ["commercial"],
  demandes:     ["commercial"],
  visites:      ["commercial"],
  contrats:     ["commercial","comptable"],
  loyers:       ["comptable"],
  ventes:       ["comptable"],
  // Les pièces jointes peuvent être ajoutées par quiconque a un accès
  // métier en écriture à au moins un module — reflète le fait qu'un
  // document est toujours attaché à un bien/client/vente/contrat.
  documents:    ["commercial","comptable"],
};
exports.requireModule = (moduleName) => (req, res, next) => {
  const role = req.user?.role;
  if (role === "superadmin" || role === "admin") return next();
  if (role === "lecture") return res.status(403).json({ error: "Compte en lecture seule." });
  const allowed = MODULE_ACCESS[moduleName] || [];
  if (!allowed.includes(role)) {
    return res.status(403).json({ error: `Votre rôle (${role}) n'a pas accès au module "${moduleName}".` });
  }
  next();
};

// backend/middleware/rateLimit.js — inline here for simplicity
const rateLimit = require("express-rate-limit");

exports.contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5,
  message: { error: "Trop de demandes. Réessayez dans 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
});

// Limite les tentatives de changement de mot de passe — sans ça, un attaquant
// disposant d'un token valide (vol de session, poste partagé non verrouillé)
// pourrait bruteforcer le champ "ancien mot de passe" sans aucune contrainte.
exports.passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { error: "Trop de tentatives de changement de mot de passe. Réessayez dans 15 minutes." },
});

exports.apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: "Trop de requêtes." },
});
