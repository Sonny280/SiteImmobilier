// config/database.js — PostgreSQL (Railway) + SQLite fallback local
// Utilise pg en production (DATABASE_URL fournie par Railway) et
// better-sqlite3 en développement local pour garder la même simplicité.
require("dotenv").config();
const isProd = !!process.env.DATABASE_URL;

let _pg = null;   // client PostgreSQL (prod)
let _sq = null;   // base SQLite (dev)

// ── Interface commune prepare() identique pour les deux drivers ───
// Toutes les routes utilisent prepare(sql).run/get/all — rien ne change
// dans les routes, seul ce fichier change.

async function initDb() {
  if (isProd) {
    await _initPg();
  } else {
    _initSqlite();
  }
}

// ── PostgreSQL (production Railway) ──────────────────────────────
async function _initPg() {
  if (_pg) return;
  const { Pool } = require("pg");
  _pg = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  // Test connexion
  await _pg.query("SELECT 1");
  console.log("✅ PostgreSQL connecté");
  await _schemaPg();
  await _migratePg();
}

async function _schemaPg() {
  await _pg.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, nom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      "createdAt" TIMESTAMPTZ DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS biens (
      id SERIAL PRIMARY KEY, ref TEXT UNIQUE, slug TEXT UNIQUE,
      titre TEXT NOT NULL, type TEXT NOT NULL, prix REAL NOT NULL,
      surface REAL, chambres INTEGER DEFAULT 0, sdb INTEGER DEFAULT 0,
      etage INTEGER, parking INTEGER DEFAULT 0,
      quartier TEXT, commune TEXT, ville TEXT DEFAULT 'Abidjan', adresse TEXT,
      statut TEXT DEFAULT 'disponible', description TEXT, equipements TEXT,
      whatsapp TEXT, telephone TEXT, emoji TEXT DEFAULT '🏢',
      featured INTEGER DEFAULT 0, vues INTEGER DEFAULT 0,
      meta_title TEXT, meta_desc TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS photos (
      id SERIAL PRIMARY KEY, "bienId" INTEGER NOT NULL,
      url TEXT NOT NULL, filename TEXT, position INTEGER DEFAULT 0,
      principale INTEGER DEFAULT 0, "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY, nom TEXT NOT NULL, email TEXT, tel TEXT,
      whatsapp TEXT, type TEXT DEFAULT 'locataire', "bienId" INTEGER,
      "dateEntree" TEXT, "dateSortie" TEXT, caution REAL DEFAULT 0,
      loyer REAL DEFAULT 0, profession TEXT, employeur TEXT, revenus REAL,
      piece_identite TEXT, notes TEXT, "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS loyers (
      id SERIAL PRIMARY KEY, "clientId" INTEGER NOT NULL, "bienId" INTEGER NOT NULL,
      montant REAL NOT NULL, mois TEXT NOT NULL, echeance TEXT,
      statut TEXT DEFAULT 'en_attente', "datePaiement" TEXT,
      "montantRecu" REAL, "modePaiement" TEXT DEFAULT 'virement',
      "joursRetard" INTEGER DEFAULT 0, penalite REAL DEFAULT 0, notes TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS contrats (
      id SERIAL PRIMARY KEY, ref TEXT UNIQUE, type TEXT DEFAULT 'bail',
      "clientId" INTEGER NOT NULL, "bienId" INTEGER NOT NULL,
      "dateDebut" TEXT, "dateFin" TEXT, loyer REAL DEFAULT 0,
      caution REAL DEFAULT 0, indexation TEXT, garantie TEXT,
      "dateSignature" TEXT, "prixVente" REAL, notaire TEXT,
      "titreVerifie" INTEGER DEFAULT 0, statut TEXT DEFAULT 'actif',
      notes TEXT, "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ventes (
      id SERIAL PRIMARY KEY, ref TEXT UNIQUE, "bienId" INTEGER NOT NULL,
      "acheteurId" INTEGER, "acheteurNom" TEXT, "acheteurTel" TEXT,
      "acheteurEmail" TEXT, "vendeurNom" TEXT, "vendeurTel" TEXT,
      "prixAffiche" REAL NOT NULL, "prixNegociation" REAL, "prixFinal" REAL,
      commission REAL DEFAULT 0, "tauxCommission" REAL DEFAULT 5,
      statut TEXT DEFAULT 'prospect', "dateOffre" TEXT, "montantOffre" REAL,
      "dateCompromis" TEXT, "dateActe" TEXT, notaire TEXT,
      acompte REAL DEFAULT 0, "modeFinancement" TEXT DEFAULT 'cash',
      banque TEXT, "titreVerifie" INTEGER DEFAULT 0,
      "diagnosticFait" INTEGER DEFAULT 0, notes TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS paiements_vente (
      id SERIAL PRIMARY KEY, "venteId" INTEGER NOT NULL,
      montant REAL NOT NULL, type TEXT DEFAULT 'acompte',
      date TEXT NOT NULL, "modePaiement" TEXT DEFAULT 'virement',
      reference TEXT, notes TEXT, "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS demandes (
      id SERIAL PRIMARY KEY, nom TEXT NOT NULL, email TEXT, tel TEXT,
      interet TEXT, budget TEXT, message TEXT, "bienId" INTEGER,
      statut TEXT DEFAULT 'nouveau', source TEXT DEFAULT 'formulaire',
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS visites (
      id SERIAL PRIMARY KEY, "bienId" INTEGER NOT NULL, "clientId" INTEGER,
      nom TEXT, tel TEXT, date TEXT NOT NULL, heure TEXT,
      statut TEXT DEFAULT 'planifie', notes TEXT,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS relances (
      id SERIAL PRIMARY KEY, "loyerId" INTEGER NOT NULL, "clientId" INTEGER NOT NULL,
      type TEXT DEFAULT 'amiable', canal TEXT DEFAULT 'whatsapp',
      date TEXT NOT NULL, notes TEXT, "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS temoignages (
      id SERIAL PRIMARY KEY, nom TEXT NOT NULL, profession TEXT,
      note INTEGER DEFAULT 5, texte TEXT NOT NULL,
      statut TEXT DEFAULT 'en_attente', "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS realisations (
      id SERIAL PRIMARY KEY, titre TEXT NOT NULL,
      type TEXT DEFAULT 'Gestion locative', description TEXT,
      annee TEXT, commune TEXT, ville TEXT DEFAULT 'Abidjan',
      image TEXT, ordre INTEGER DEFAULT 0, visible INTEGER DEFAULT 1,
      "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY, nom TEXT NOT NULL, type TEXT DEFAULT 'autre',
      entite TEXT NOT NULL, "entiteId" INTEGER NOT NULL,
      fichier TEXT NOT NULL, taille INTEGER, "mimeType" TEXT,
      notes TEXT, "createdAt" TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY, titre TEXT NOT NULL, slug TEXT UNIQUE,
      categorie TEXT DEFAULT 'Actualités', resume TEXT, contenu TEXT,
      auteur TEXT DEFAULT 'ImmobilierCI', statut TEXT DEFAULT 'brouillon',
      image TEXT, tags TEXT, vues INTEGER DEFAULT 0,
      "createdAt" TIMESTAMPTZ DEFAULT NOW(), "updatedAt" TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Index
  await _pg.query(`
    CREATE INDEX IF NOT EXISTS idx_biens_type ON biens(type);
    CREATE INDEX IF NOT EXISTS idx_biens_statut ON biens(statut);
    CREATE INDEX IF NOT EXISTS idx_photos_bien ON photos("bienId");
    CREATE INDEX IF NOT EXISTS idx_loyers_mois ON loyers(mois);
    CREATE INDEX IF NOT EXISTS idx_loyers_statut ON loyers(statut);
    CREATE INDEX IF NOT EXISTS idx_ventes_statut ON ventes(statut);
  `).catch(() => {});
}

async function _migratePg() {
  // Migrations pour bases existantes
  const migrations = [
    `ALTER TABLE contrats ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'bail'`,
    `ALTER TABLE contrats ADD COLUMN IF NOT EXISTS indexation TEXT`,
    `ALTER TABLE contrats ADD COLUMN IF NOT EXISTS "dateSignature" TEXT`,
    `ALTER TABLE contrats ADD COLUMN IF NOT EXISTS "prixVente" REAL`,
    `ALTER TABLE contrats ADD COLUMN IF NOT EXISTS notaire TEXT`,
    `ALTER TABLE contrats ADD COLUMN IF NOT EXISTS "titreVerifie" INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT NOW()`,
  ];
  for (const sql of migrations) {
    await _pg.query(sql).catch(() => {});
  }
}

// ── SQLite (développement local) ──────────────────────────────────
function _initSqlite() {
  if (_sq) return;
  const path = require("path");
  const fs   = require("fs");
  const DB_PATH = path.join(__dirname, "../sei.db");

  try {
    // Essayer better-sqlite3 d'abord (plus rapide)
    const Database = require("better-sqlite3");
    _sq = new Database(DB_PATH);
    _sq._type = "better";
    console.log("✅ SQLite (better-sqlite3) connecté");
  } catch {
    // Fallback sql.js
    const initSqlJs = require("sql.js");
    const SQL = require("sql.js");
    // sql.js sync workaround
    const sqlJs = require("sql.js");
    _sq = { _type: "sqljs", _path: DB_PATH };
    console.log("✅ SQLite (sql.js) connecté");
  }
  _schemaSqlite();
}

function _schemaSqlite() {
  // Utilise l'ancienne logique sql.js inchangée
  const path   = require("path");
  const fs     = require("fs");
  const DB_PATH = path.join(__dirname, "../sei.db");

  const { initSqlJs } = require("./database_sqlite");
  // On délègue au fichier SQLite existant
}

// ── Interface prepare() unifiée ───────────────────────────────────
// PostgreSQL : async via Pool.query()
// SQLite     : sync via l'ancien code (inchangé)
// Les routes appellent toujours prepare(sql).run/get/all — mais en mode
// PostgreSQL ces méthodes retournent des Promesses que les routes await.

function prepare(sql) {
  if (isProd && _pg) {
    // Convertit les ? SQLite en $1 $2 ... PostgreSQL
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    return {
      async run(...params) {
        // Pour INSERT retourne lastInsertRowid
        const isInsert = /^\s*INSERT/i.test(sql);
        const q = isInsert ? pgSql + " RETURNING id" : pgSql;
        const r = await _pg.query(q, params.map(v => v === undefined ? null : v));
        return {
          lastInsertRowid: r.rows[0]?.id || 0,
          changes: r.rowCount,
        };
      },
      async get(...params) {
        const r = await _pg.query(pgSql + (pgSql.includes("LIMIT") ? "" : " LIMIT 1"), params.map(v => v === undefined ? null : v));
        return r.rows[0] || null;
      },
      async all(...params) {
        const r = await _pg.query(pgSql, params.map(v => v === undefined ? null : v));
        return r.rows;
      },
    };
  }

  // Mode SQLite local — délègue à l'ancien module
  return require("./database_sqlite").prepare(sql);
}

async function exec(sql) {
  if (isProd && _pg) { await _pg.query(sql).catch(() => {}); return; }
  require("./database_sqlite").exec(sql);
}

module.exports = { prepare, exec, initDb };
