// init.js — initialise la base et crée le compte admin si inexistant
require("dotenv").config();

async function init() {
  // Charger database APRÈS dotenv pour que DATABASE_URL soit disponible
  const { initDb, prepare } = require("./config/database");
  const bcrypt = require("bcryptjs");

  try {
    await initDb();
    console.log("✅ Base initialisée");
  } catch(e) {
    console.error("❌ Connexion base échouée:", e.message);
    process.exit(1);
  }

  try {
    const exists = await prepare(
      "SELECT id FROM users WHERE role='superadmin' LIMIT 1"
    ).get();

    if (!exists) {
      await prepare(
        "INSERT INTO users(nom,email,password,role) VALUES(?,?,?,?)"
      ).run(
        "Kouassi Atse Charles",
        "contact@immobilierci.ci",
        bcrypt.hashSync("Admin2025!", 12),
        "superadmin"
      );
      console.log("✅ Compte admin créé : contact@immobilierci.ci / Admin2025!");
    } else {
      console.log("✅ Base déjà initialisée");
    }
  } catch(e) {
    console.error("❌ Init admin échouée:", e.message);
    process.exit(1);
  }
}

init();
