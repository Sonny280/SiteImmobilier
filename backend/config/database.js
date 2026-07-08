require("dotenv").config();
const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");
const DB_PATH = path.join(__dirname, "../sei.db");
let _db = null;

async function initDb() {
  if (_db) return _db;
  const SQL = await initSqlJs();
  _db = fs.existsSync(DB_PATH) ? new SQL.Database(fs.readFileSync(DB_PATH)) : new SQL.Database();
  _db._save = function() { fs.writeFileSync(DB_PATH, Buffer.from(this.export())); };
  _schema(_db);
  _migrate(_db);
  _db._save();
  return _db;
}

// Ajoute les colonnes manquantes sur une base déjà créée avec un schéma plus
// ancien. CREATE TABLE IF NOT EXISTS ne modifie jamais une table existante —
// sans cette étape, une base déployée avant l'introduction des contrats de
// vente continuerait de refuser les colonnes type/prixVente/notaire/etc.
function _migrate(db) {
  const cols = db.exec("PRAGMA table_info(contrats)");
  const existing = cols[0] ? cols[0].values.map(r => r[1]) : [];
  const wanted = {
    type: "TEXT DEFAULT 'bail'",
    indexation: "TEXT",
    dateSignature: "TEXT",
    prixVente: "REAL",
    notaire: "TEXT",
    titreVerifie: "INTEGER DEFAULT 0",
  };
  for (const [col, def] of Object.entries(wanted)) {
    if (!existing.includes(col)) {
      try { db.run(`ALTER TABLE contrats ADD COLUMN ${col} ${def}`); }
      catch (e) { console.error(`Migration contrats.${col} échouée:`, e.message); }
    }
  }
}

function _schema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, role TEXT DEFAULT 'admin', createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS biens (id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT UNIQUE, slug TEXT UNIQUE, titre TEXT NOT NULL, type TEXT NOT NULL, prix REAL NOT NULL, surface REAL, chambres INTEGER DEFAULT 0, sdb INTEGER DEFAULT 0, etage INTEGER, parking INTEGER DEFAULT 0, quartier TEXT, commune TEXT, ville TEXT DEFAULT 'Abidjan', adresse TEXT, statut TEXT DEFAULT 'disponible', description TEXT, equipements TEXT, whatsapp TEXT, telephone TEXT, emoji TEXT DEFAULT '🏢', featured INTEGER DEFAULT 0, vues INTEGER DEFAULT 0, meta_title TEXT, meta_desc TEXT, createdAt TEXT DEFAULT (datetime('now')), updatedAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, bienId INTEGER NOT NULL, url TEXT NOT NULL, filename TEXT, position INTEGER DEFAULT 0, principale INTEGER DEFAULT 0, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, email TEXT, tel TEXT, whatsapp TEXT, type TEXT DEFAULT 'locataire', bienId INTEGER, dateEntree TEXT, dateSortie TEXT, caution REAL DEFAULT 0, loyer REAL DEFAULT 0, profession TEXT, employeur TEXT, revenus REAL, piece_identite TEXT, notes TEXT, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS loyers (id INTEGER PRIMARY KEY AUTOINCREMENT, clientId INTEGER NOT NULL, bienId INTEGER NOT NULL, montant REAL NOT NULL, mois TEXT NOT NULL, echeance TEXT, statut TEXT DEFAULT 'en_attente', datePaiement TEXT, montantRecu REAL, modePaiement TEXT DEFAULT 'virement', joursRetard INTEGER DEFAULT 0, penalite REAL DEFAULT 0, notes TEXT, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS contrats (id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT UNIQUE, type TEXT DEFAULT 'bail', clientId INTEGER NOT NULL, bienId INTEGER NOT NULL, dateDebut TEXT, dateFin TEXT, loyer REAL DEFAULT 0, caution REAL DEFAULT 0, indexation TEXT, garantie TEXT, dateSignature TEXT, prixVente REAL, notaire TEXT, titreVerifie INTEGER DEFAULT 0, statut TEXT DEFAULT 'actif', notes TEXT, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS ventes (id INTEGER PRIMARY KEY AUTOINCREMENT, ref TEXT UNIQUE, bienId INTEGER NOT NULL, acheteurId INTEGER, acheteurNom TEXT, acheteurTel TEXT, acheteurEmail TEXT, vendeurNom TEXT, vendeurTel TEXT, prixAffiche REAL NOT NULL, prixNegociation REAL, prixFinal REAL, commission REAL DEFAULT 0, tauxCommission REAL DEFAULT 5, statut TEXT DEFAULT 'prospect', dateOffre TEXT, montantOffre REAL, dateCompromis TEXT, dateActe TEXT, notaire TEXT, acompte REAL DEFAULT 0, modeFinancement TEXT DEFAULT 'cash', banque TEXT, titreVerifie INTEGER DEFAULT 0, diagnosticFait INTEGER DEFAULT 0, notes TEXT, createdAt TEXT DEFAULT (datetime('now')), updatedAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS paiements_vente (id INTEGER PRIMARY KEY AUTOINCREMENT, venteId INTEGER NOT NULL, montant REAL NOT NULL, type TEXT DEFAULT 'acompte', date TEXT NOT NULL, modePaiement TEXT DEFAULT 'virement', reference TEXT, notes TEXT, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS demandes (id INTEGER PRIMARY KEY AUTOINCREMENT, nom TEXT NOT NULL, email TEXT, tel TEXT, interet TEXT, budget TEXT, message TEXT, bienId INTEGER, statut TEXT DEFAULT 'nouveau', source TEXT DEFAULT 'formulaire', createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS visites (id INTEGER PRIMARY KEY AUTOINCREMENT, bienId INTEGER NOT NULL, clientId INTEGER, nom TEXT, tel TEXT, date TEXT NOT NULL, heure TEXT, statut TEXT DEFAULT 'planifie', notes TEXT, createdAt TEXT DEFAULT (datetime('now')));
    CREATE TABLE IF NOT EXISTS relances (id INTEGER PRIMARY KEY AUTOINCREMENT, loyerId INTEGER NOT NULL, clientId INTEGER NOT NULL, type TEXT DEFAULT 'amiable', canal TEXT DEFAULT 'whatsapp', date TEXT NOT NULL, notes TEXT, createdAt TEXT DEFAULT (datetime('now')));
    
    CREATE TABLE IF NOT EXISTS temoignages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      profession TEXT,
      note INTEGER DEFAULT 5,
      texte TEXT NOT NULL,
      statut TEXT DEFAULT 'en_attente',
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS realisations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titre TEXT NOT NULL,
      type TEXT DEFAULT 'Gestion locative',
      description TEXT,
      annee TEXT,
      commune TEXT,
      ville TEXT DEFAULT 'Abidjan',
      image TEXT,
      ordre INTEGER DEFAULT 0,
      visible INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      type TEXT DEFAULT 'autre',
      entite TEXT NOT NULL,
      entiteId INTEGER NOT NULL,
      fichier TEXT NOT NULL,
      taille INTEGER,
      mimeType TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titre TEXT NOT NULL,
      slug TEXT UNIQUE,
      categorie TEXT DEFAULT 'Actualités',
      resume TEXT,
      contenu TEXT,
      auteur TEXT DEFAULT 'ImmobilierCI',
      statut TEXT DEFAULT 'brouillon',
      image TEXT,
      tags TEXT,
      vues INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_biens_type ON biens(type);
    CREATE INDEX IF NOT EXISTS idx_biens_statut ON biens(statut);
    CREATE INDEX IF NOT EXISTS idx_photos_bien ON photos(bienId);
    CREATE INDEX IF NOT EXISTS idx_loyers_mois ON loyers(mois);
    CREATE INDEX IF NOT EXISTS idx_loyers_statut ON loyers(statut);
    CREATE INDEX IF NOT EXISTS idx_ventes_statut ON ventes(statut);
  `);
}

function _rows(res) {
  if (!res || !res.values || !res.values.length) return [];
  return res.values.map(row => { const o={}; res.columns.forEach((c,i)=>{ o[c]=row[i]; }); return o; });
}

function prepare(sql) {
  return {
    run(...p) {
      if (!_db) throw new Error("DB not ready");
      _db.run(sql, p.map(v => v===undefined?null:v));
      const id = _rows(_db.exec("SELECT last_insert_rowid() as id")[0])[0]?.id || 0;
      const ch = _rows(_db.exec("SELECT changes() as c")[0])[0]?.c || 0;
      _db._save();
      return { lastInsertRowid: id, changes: ch };
    },
    get(...p) {
      if (!_db) throw new Error("DB not ready");
      const s = _db.prepare(sql);
      s.bind(p.map(v => v===undefined?null:v));
      const row = s.step() ? s.getAsObject() : null;
      s.free();
      return row;
    },
    all(...p) {
      if (!_db) throw new Error("DB not ready");
      const r = _db.exec(sql, p.map(v => v===undefined?null:v));
      return r.length ? _rows(r[0]) : [];
    },
  };
}

function exec(sql) { if (_db) { _db.run(sql); _db._save(); } }
module.exports = { prepare, exec, initDb };
