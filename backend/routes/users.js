// routes/users.js — gestion complète des comptes admin
const express  = require("express");
const router   = express.Router();
const bcrypt   = require("bcryptjs");
const { prepare } = require("../config/database");
const { auth, passwordLimiter } = require("../middleware/auth");

const ROLES = ["superadmin","admin","commercial","comptable","lecture"];

async function superAdmin(req, res, next) {
  if (req.user?.role !== "superadmin") return res.status(403).json({ error: "Accès réservé au super-administrateur" });
  next();
}

// Règle de robustesse minimale du mot de passe — appliquée à toute création/changement.
async function validatePassword(pwd) {
  if (!pwd || pwd.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!/[A-Z]/.test(pwd)) return "Le mot de passe doit contenir au moins une majuscule.";
  if (!/[0-9]/.test(pwd)) return "Le mot de passe doit contenir au moins un chiffre.";
  return null;
}

async function countSuperadmins() {
  return await prepare("SELECT COUNT(*) as n FROM users WHERE role='superadmin'").get().n;
}

// ── GET /api/users — liste (superadmin uniquement) ────────────────
router.get("/", auth, superAdmin, async (req, res) => {
  res.json(await prepare("SELECT id,nom,email,role,createdAt,updatedAt FROM users ORDER BY createdAt DESC").all());
});

// ── GET /api/users/me — profil courant (tout rôle connecté) ───────
router.get("/me", auth, async (req, res) => {
  const u = await prepare("SELECT id,nom,email,role,createdAt FROM users WHERE id=?").get(req.user.id);
  if (!u) return res.status(404).json({ error: "Utilisateur introuvable" });
  res.json(u);
});

// ── POST /api/users — créer un compte (superadmin uniquement) ─────
router.post("/", auth, superAdmin, async (req, res) => {
  const { nom, email, password, role } = req.body;
  if (!nom || !email || !password) return res.status(400).json({ error: "Nom, email et mot de passe requis" });
  if (!ROLES.includes(role)) return res.status(400).json({ error: "Rôle invalide" });
  const pwdErr = validatePassword(password);
  if (pwdErr) return res.status(400).json({ error: pwdErr });
  if (await prepare("SELECT id FROM users WHERE email=?").get(email)) return res.status(409).json({ error: "Cet email est déjà utilisé" });
  const hash = await bcrypt.hash(password, 12);
  const r = await prepare("INSERT INTO users(nom,email,password,role)VALUES(?,?,?,?)").run(nom, email, hash, role);
  res.status(201).json(await prepare("SELECT id,nom,email,role,createdAt FROM users WHERE id=?").get(r.lastInsertRowid));
});

// ── PUT /api/users/:id — modifier nom/email/rôle (superadmin uniquement) ──
router.put("/:id", auth, superAdmin, async (req, res) => {
  const id = +req.params.id;
  const { nom, email, role } = req.body;
  const u = await prepare("SELECT * FROM users WHERE id=?").get(id);
  if (!u) return res.status(404).json({ error: "Introuvable" });

  if (role && !ROLES.includes(role)) return res.status(400).json({ error: "Rôle invalide" });
  // Empêcher de rétrograder le dernier superadmin (y compris soi-même)
  if (u.role === "superadmin" && role && role !== "superadmin" && await countSuperadmins() <= 1) {
    return res.status(400).json({ error: "Impossible de rétrograder le seul super-administrateur restant." });
  }
  if (email && email !== u.email && await prepare("SELECT id FROM users WHERE email=? AND id!=?").get(email, id)) {
    return res.status(409).json({ error: "Cet email est déjà utilisé par un autre compte." });
  }

  await prepare("UPDATE users SET nom=?,email=?,role=?,updatedAt=datetime('now') WHERE id=?")
    .run(nom || u.nom, email || u.email, role || u.role, id);
  res.json(await prepare("SELECT id,nom,email,role,createdAt,updatedAt FROM users WHERE id=?").get(id));
});

// ── PUT /api/users/:id/password — changer le mot de passe d'un AUTRE compte
//     (superadmin uniquement — pour réinitialiser le mot de passe d'un employé) ──
router.put("/:id/password", auth, superAdmin, passwordLimiter, async (req, res) => {
  const id = +req.params.id;
  const { password } = req.body;
  const u = await prepare("SELECT * FROM users WHERE id=?").get(id);
  if (!u) return res.status(404).json({ error: "Introuvable" });
  const pwdErr = validatePassword(password);
  if (pwdErr) return res.status(400).json({ error: pwdErr });
  const hash = await bcrypt.hash(password, 12);
  await prepare("UPDATE users SET password=?,updatedAt=datetime('now') WHERE id=?").run(hash, id);
  res.json({ success: true, message: "Mot de passe réinitialisé." });
});

// ── PUT /api/users/me/password — changer SON PROPRE mot de passe
//     (tout rôle connecté — nécessite de connaître l'ancien mot de passe) ──
router.put("/me/password", auth, passwordLimiter, async (req, res) => {
  const { ancien, nouveau } = req.body;
  if (!ancien || !nouveau) return res.status(400).json({ error: "Ancien et nouveau mot de passe requis." });
  const u = await prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
  if (!u) return res.status(404).json({ error: "Utilisateur introuvable" });
  if (!bcrypt.compareSync(ancien, u.password)) return res.status(401).json({ error: "Mot de passe actuel incorrect." });
  const pwdErr = validatePassword(nouveau);
  if (pwdErr) return res.status(400).json({ error: pwdErr });
  const hash = await bcrypt.hash(nouveau, 12);
  await prepare("UPDATE users SET password=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(hash, req.user.id);
  res.json({ success: true, message: "Mot de passe modifié." });
});

// ── DELETE /api/users/:id — supprimer un compte (superadmin uniquement) ───
router.delete("/:id", auth, superAdmin, async (req, res) => {
  const id = +req.params.id;
  const u = await prepare("SELECT * FROM users WHERE id=?").get(id);
  if (!u) return res.status(404).json({ error: "Introuvable" });
  if (id === req.user.id) return res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte." });
  if (u.role === "superadmin" && await countSuperadmins() <= 1) {
    return res.status(400).json({ error: "Impossible de supprimer le seul super-administrateur." });
  }
  await prepare("DELETE FROM users WHERE id=?").run(id);
  res.json({ success: true });
});

module.exports = router;


