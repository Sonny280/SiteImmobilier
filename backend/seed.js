// seed.js — ImmobilierCI
// Crée uniquement le compte administrateur
// Les vraies données sont saisies directement dans le panneau admin
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { prepare, initDb } = require("./config/database");

async function seed() {
  await initDb();
  console.log("🌱 ImmobilierCI — Initialisation...\n");

  // Compte superadmin
  prepare("INSERT OR REPLACE INTO users(nom,email,password,role)VALUES(?,?,?,?)")
    .run("Kouassi Atse Charles","contact@immobilierci.ci",bcrypt.hashSync("Admin2025!",10),"superadmin");

  console.log("✅ Compte admin créé");
  console.log("📧 Email    : contact@immobilierci.ci");
  console.log("🔑 Mot de passe : Admin2025!");
  console.log("\n⚠️  Changez le mot de passe après la première connexion !");
  console.log("\n🎉 Base ImmobilierCI prête !");
  process.exit(0);
}

seed().catch(e => { console.error("❌", e.message); process.exit(1); });
