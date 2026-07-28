// middleware/auth.js
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const DEFAULT_SECRET = "sei_secret_2025";
const SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

if (process.env.NODE_ENV === "production" && SECRET === DEFAULT_SECRET) {
  console.error("❌ JWT_SECRET non défini en production !");
  process.exit(1);
}

// Lit le token depuis le header Authorization: Bearer <token>
exports.auth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Non authentifié" });
  try {
    req.user = jwt.verify(h.split(" ")[1], SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Session expirée, veuillez vous reconnecter" });
  }
};

exports.requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ error: "Vous n'avez pas la permission d'effectuer cette action." });
  next();
};

exports.requireWrite = (req, res, next) => {
  if (req.user?.role === "lecture")
    return res.status(403).json({ error: "Votre compte est en lecture seule." });
  next();
};

const MODULE_ACCESS = {
  biens:["commercial"], clients:["commercial"], demandes:["commercial"],
  visites:["commercial"], contrats:["commercial","comptable"],
  loyers:["comptable"], ventes:["comptable"], documents:["commercial","comptable"],
};

exports.requireModule = (moduleName) => (req, res, next) => {
  const role = req.user?.role;
  if (role==="superadmin"||role==="admin") return next();
  if (role==="lecture") return res.status(403).json({ error: "Compte en lecture seule." });
  const allowed = MODULE_ACCESS[moduleName] || [];
  if (!allowed.includes(role))
    return res.status(403).json({ error: `Votre rôle (${role}) n'a pas accès au module "${moduleName}".` });
  next();
};

exports.contactLimiter = rateLimit({ windowMs:15*60*1000, max:5, message:{error:"Trop de demandes."}, standardHeaders:true, legacyHeaders:false });
exports.loginLimiter   = rateLimit({ windowMs:15*60*1000, max:10, message:{error:"Trop de tentatives."} });
exports.passwordLimiter= rateLimit({ windowMs:15*60*1000, max:8,  message:{error:"Trop de tentatives."} });
exports.apiLimiter     = rateLimit({ windowMs:1*60*1000,  max:100, message:{error:"Trop de requêtes."} });

