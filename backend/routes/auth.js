// routes/auth.js — authentification par cookie HttpOnly
// Le token JWT est stocké dans un cookie HttpOnly, ce qui signifie qu'aucun
// code JavaScript côté client ne peut y accéder — protection contre le vol
// de session via XSS. Le cookie est envoyé automatiquement par le navigateur
// à chaque requête vers le même domaine (credentials: true dans CORS).
const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { prepare } = require("../config/database");
const { loginLimiter } = require("../middleware/auth");

const SECRET   = process.env.JWT_SECRET || "sei_secret_2025";
const isProd   = process.env.NODE_ENV === "production";
const COOKIE   = "li_session";

// Options du cookie — HttpOnly empêche tout accès JavaScript.
// Secure n'est activé qu'en production (nécessite HTTPS).
// SameSite=Lax protège contre le CSRF sans bloquer la navigation normale.
const COOKIE_OPTS = {
  httpOnly: true,
  secure:   isProd,
  sameSite: isProd ? "Lax" : "Lax",
  maxAge:   7 * 24 * 60 * 60 * 1000,  // 7 jours en millisecondes
  path:     "/",
};

// POST /api/auth/login
router.post("/login", loginLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });
  const user = prepare("SELECT * FROM users WHERE email=?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: "Identifiants incorrects" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, nom: user.nom },
    SECRET,
    { expiresIn: "7d" }
  );

  // Poser le cookie HttpOnly — le frontend ne reçoit que le profil, pas le token.
  res.cookie(COOKIE, token, COOKIE_OPTS);
  res.json({ user: { id: user.id, nom: user.nom, email: user.email, role: user.role } });
});

// POST /api/auth/logout — efface le cookie de session
router.post("/logout", (_, res) => {
  res.clearCookie(COOKIE, { path: "/", httpOnly: true, secure: isProd, sameSite: "Lax" });
  res.json({ success: true });
});

// GET /api/auth/me — vérifie la session et renvoie le profil courant.
// Lit le cookie HttpOnly (pas le header Authorization).
router.get("/me", (req, res) => {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: "Non authentifié" });
  try {
    const payload = jwt.verify(token, SECRET);
    const user = prepare("SELECT id,nom,email,role FROM users WHERE id=?").get(payload.id);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(user);
  } catch {
    res.clearCookie(COOKIE, { path: "/", httpOnly: true, secure: isProd, sameSite: "Lax" });
    res.status(401).json({ error: "Session expirée, veuillez vous reconnecter" });
  }
});

module.exports = router;
