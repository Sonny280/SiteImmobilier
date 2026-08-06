// routes/auth.js — JWT renvoyé dans le body (cross-domain Vercel/Railway)
const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const { prepare } = require("../config/database");
const { loginLimiter } = require("../middleware/auth");

const SECRET = process.env.JWT_SECRET || "sei_secret_2025";

// POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });
    const user = await prepare("SELECT * FROM users WHERE email=?").get(email);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: "Identifiants incorrects" });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom },
      SECRET, { expiresIn: "7d" }
    );
    // Renvoi du token dans le body — nécessaire en cross-domain (Vercel/Railway)
    // car les cookies SameSite=Lax sont bloqués entre domaines différents.
    res.json({ token, user: { id: user.id, nom: user.nom, email: user.email, role: user.role } });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/logout
router.post("/logout", (_, res) => {
  res.json({ success: true });
});

// GET /api/auth/me — vérifie le token Authorization header
router.get("/me", async (req, res) => {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith("Bearer ")) return res.status(401).json({ error: "Non authentifié" });
    const payload = jwt.verify(h.split(" ")[1], SECRET);
    const user = await prepare("SELECT id,nom,email,role FROM users WHERE id=?").get(payload.id);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(user);
  } catch {
    res.status(401).json({ error: "Session expirée" });
  }
});

module.exports = router;
