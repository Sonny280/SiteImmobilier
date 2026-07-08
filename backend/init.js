// init.js — exécuté au démarrage sur Railway
// Initialise la base de données et crée le compte admin si inexistant
require("dotenv").config();
const { initDb, prepare } = require("./config/database");
const bcrypt = require("bcryptjs");

async function init() {
  await initDb();
  const exists = await prepare("SELECT id FROM users WHERE role='superadmin' LIMIT 1").get();
  if (!exists) {
    await prepare("INSERT INTO users(nom,email,password,role)VALUES(?,?,?,?)")
      .run(
        "Kouassi Atse Charles",
        "contact@immobilierci.ci",
        bcrypt.hashSync("Admin2025!", 12),
        "superadmin"
      );
    console.log("✅ Compte admin créé : contact@immobilierci.ci / Admin2025!");
  } else {
    console.log("✅ Base déjà initialisée");
  }
}

init().catch(e => { console.error("❌ Init échouée:", e.message); process.exit(1); });
