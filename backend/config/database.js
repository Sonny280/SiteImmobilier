// config/database.js — PostgreSQL (Railway) avec colonnes snake_case
require("dotenv").config();
const isProd = !!process.env.DATABASE_URL;
let _pg = null;

// Convertit les clés snake_case des résultats PG en camelCase
// pour garder la compatibilité avec tout le code existant
function keysToCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
    result[camel] = v;
  }
  return result;
}

// Convertit les noms camelCase dans le SQL en snake_case pour PostgreSQL
function sqlToSnake(sql) {
  return sql
    .replace(/\bcreatedAt\b/g, 'created_at')
    .replace(/\bupdatedAt\b/g, 'updated_at')
    .replace(/\bbienId\b/g, 'bien_id')
    .replace(/\bclientId\b/g, 'client_id')
    .replace(/\bventeId\b/g, 'vente_id')
    .replace(/\bloyerId\b/g, 'loyer_id')
    .replace(/\bentiteId\b/g, 'entite_id')
    .replace(/\bdateDebut\b/g, 'date_debut')
    .replace(/\bdateFin\b/g, 'date_fin')
    .replace(/\bdatePaiement\b/g, 'date_paiement')
    .replace(/\bmodePaiement\b/g, 'mode_paiement')
    .replace(/\bmontantRecu\b/g, 'montant_recu')
    .replace(/\bjoursRetard\b/g, 'jours_retard')
    .replace(/\bprixAffiche\b/g, 'prix_affiche')
    .replace(/\bprixFinal\b/g, 'prix_final')
    .replace(/\bprixNegociation\b/g, 'prix_negociation')
    .replace(/\btauxCommission\b/g, 'taux_commission')
    .replace(/\bmodeFinancement\b/g, 'mode_financement')
    .replace(/\btitreVerifie\b/g, 'titre_verifie')
    .replace(/\bdiagnosticFait\b/g, 'diagnostic_fait')
    .replace(/\bdateOffre\b/g, 'date_offre')
    .replace(/\bmontantOffre\b/g, 'montant_offre')
    .replace(/\bdateCompromis\b/g, 'date_compromis')
    .replace(/\bdateActe\b/g, 'date_acte')
    .replace(/\bdateEntree\b/g, 'date_entree')
    .replace(/\bdateSortie\b/g, 'date_sortie')
    .replace(/\bdateSignature\b/g, 'date_signature')
    .replace(/\bprixVente\b/g, 'prix_vente')
    .replace(/\bacheteurId\b/g, 'acheteur_id')
    .replace(/\bacheteurNom\b/g, 'acheteur_nom')
    .replace(/\bacheteurTel\b/g, 'acheteur_tel')
    .replace(/\bacheteurEmail\b/g, 'acheteur_email')
    .replace(/\bvendeurNom\b/g, 'vendeur_nom')
    .replace(/\bvendeurTel\b/g, 'vendeur_tel')
    .replace(/\bmimeType\b/g, 'mime_type')
    .replace(/\blast_insert_rowid\(\)/g, 'lastval()');
}

async function initDb() {
  if (!isProd) { _initSqlite(); return; }
  if (_pg) return;
  const { Pool } = require("pg");
  _pg = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await _pg.query("SELECT 1");
  console.log("✅ PostgreSQL connecté");
  await _dropAndRecreate();
}

// Supprime toutes les tables existantes et recrée avec snake_case
// Nécessaire car l'ancienne version utilisait des colonnes camelCase
// que PostgreSQL stocke en minuscules sans guillemets
async function _dropAndRecreate() {
  // Vérifier si les tables existent déjà avec le bon schéma
  const check = await _pg.query(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_name='biens' AND column_name='created_at' LIMIT 1`
  );
  
  if (check.rows.length > 0) {
    console.log("✅ Schéma PostgreSQL déjà correct");
    return;
  }

  console.log("🔄 Migration du schéma PostgreSQL...");
  
  // Supprimer les tables dans l'ordre (dépendances)
  await _pg.query(`
    DROP TABLE IF EXISTS paiements_vente CASCADE;
    DROP TABLE IF EXISTS documents CASCADE;
    DROP TABLE IF EXISTS relances CASCADE;
    DROP TABLE IF EXISTS visites CASCADE;
    DROP TABLE IF EXISTS demandes CASCADE;
    DROP TABLE IF EXISTS contrats CASCADE;
    DROP TABLE IF EXISTS loyers CASCADE;
    DROP TABLE IF EXISTS ventes CASCADE;
    DROP TABLE IF EXISTS photos CASCADE;
    DROP TABLE IF EXISTS clients CASCADE;
    DROP TABLE IF EXISTS articles CASCADE;
    DROP TABLE IF EXISTS temoignages CASCADE;
    DROP TABLE IF EXISTS realisations CASCADE;
    DROP TABLE IF EXISTS biens CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `);

  // Recréer avec snake_case
  await _pg.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY, nom TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE biens (
      id SERIAL PRIMARY KEY, ref TEXT UNIQUE, slug TEXT UNIQUE,
      titre TEXT NOT NULL, type TEXT NOT NULL, prix REAL NOT NULL,
      surface REAL, chambres INTEGER DEFAULT 0, sdb INTEGER DEFAULT 0,
      etage INTEGER, parking INTEGER DEFAULT 0,
      quartier TEXT, commune TEXT, ville TEXT DEFAULT 'Abidjan', adresse TEXT,
      statut TEXT DEFAULT 'disponible', description TEXT, equipements TEXT,
      whatsapp TEXT, telephone TEXT, emoji TEXT DEFAULT '🏢',
      featured INTEGER DEFAULT 0, vues INTEGER DEFAULT 0,
      meta_title TEXT, meta_desc TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE photos (
      id SERIAL PRIMARY KEY, bien_id INTEGER NOT NULL,
      url TEXT NOT NULL, filename TEXT, position INTEGER DEFAULT 0,
      principale INTEGER DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE clients (
      id SERIAL PRIMARY KEY, nom TEXT NOT NULL, email TEXT, tel TEXT,
      whatsapp TEXT, type TEXT DEFAULT 'locataire', bien_id INTEGER,
      date_entree TEXT, date_sortie TEXT, caution REAL DEFAULT 0,
      loyer REAL DEFAULT 0, profession TEXT, employeur TEXT, revenus REAL,
      piece_identite TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE loyers (
      id SERIAL PRIMARY KEY, client_id INTEGER NOT NULL, bien_id INTEGER NOT NULL,
      montant REAL NOT NULL, mois TEXT NOT NULL, echeance TEXT,
      statut TEXT DEFAULT 'en_attente', date_paiement TEXT,
      montant_recu REAL, mode_paiement TEXT DEFAULT 'virement',
      jours_retard INTEGER DEFAULT 0, penalite REAL DEFAULT 0, notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE contrats (
      id SERIAL PRIMARY KEY, ref TEXT UNIQUE, type TEXT DEFAULT 'bail',
      client_id INTEGER NOT NULL, bien_id INTEGER NOT NULL,
      date_debut TEXT, date_fin TEXT, loyer REAL DEFAULT 0,
      caution REAL DEFAULT 0, indexation TEXT, garantie TEXT,
      date_signature TEXT, prix_vente REAL, notaire TEXT,
      titre_verifie INTEGER DEFAULT 0, statut TEXT DEFAULT 'actif',
      notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE ventes (
      id SERIAL PRIMARY KEY, ref TEXT UNIQUE, bien_id INTEGER NOT NULL,
      acheteur_id INTEGER, acheteur_nom TEXT, acheteur_tel TEXT,
      acheteur_email TEXT, vendeur_nom TEXT, vendeur_tel TEXT,
      prix_affiche REAL NOT NULL, prix_negociation REAL, prix_final REAL,
      commission REAL DEFAULT 0, taux_commission REAL DEFAULT 5,
      statut TEXT DEFAULT 'prospect', date_offre TEXT, montant_offre REAL,
      date_compromis TEXT, date_acte TEXT, notaire TEXT,
      acompte REAL DEFAULT 0, mode_financement TEXT DEFAULT 'cash',
      banque TEXT, titre_verifie INTEGER DEFAULT 0,
      diagnostic_fait INTEGER DEFAULT 0, notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE paiements_vente (
      id SERIAL PRIMARY KEY, vente_id INTEGER NOT NULL,
      montant REAL NOT NULL, type TEXT DEFAULT 'acompte',
      date TEXT NOT NULL, mode_paiement TEXT DEFAULT 'virement',
      reference TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE demandes (
      id SERIAL PRIMARY KEY, nom TEXT NOT NULL, email TEXT, tel TEXT,
      interet TEXT, budget TEXT, message TEXT, bien_id INTEGER,
      statut TEXT DEFAULT 'nouveau', source TEXT DEFAULT 'formulaire',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE visites (
      id SERIAL PRIMARY KEY, bien_id INTEGER NOT NULL, client_id INTEGER,
      nom TEXT, tel TEXT, date TEXT NOT NULL, heure TEXT,
      statut TEXT DEFAULT 'planifie', notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE relances (
      id SERIAL PRIMARY KEY, loyer_id INTEGER NOT NULL, client_id INTEGER NOT NULL,
      type TEXT DEFAULT 'amiable', canal TEXT DEFAULT 'whatsapp',
      date TEXT NOT NULL, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE temoignages (
      id SERIAL PRIMARY KEY, nom TEXT NOT NULL, profession TEXT,
      note INTEGER DEFAULT 5, texte TEXT NOT NULL,
      statut TEXT DEFAULT 'en_attente', created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE realisations (
      id SERIAL PRIMARY KEY, titre TEXT NOT NULL,
      type TEXT DEFAULT 'Gestion locative', description TEXT,
      annee TEXT, commune TEXT, ville TEXT DEFAULT 'Abidjan',
      image TEXT, ordre INTEGER DEFAULT 0, visible INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE documents (
      id SERIAL PRIMARY KEY, nom TEXT NOT NULL, type TEXT DEFAULT 'autre',
      entite TEXT NOT NULL, entite_id INTEGER NOT NULL,
      fichier TEXT NOT NULL, taille INTEGER, mime_type TEXT,
      notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE articles (
      id SERIAL PRIMARY KEY, titre TEXT NOT NULL, slug TEXT UNIQUE,
      categorie TEXT DEFAULT 'Actualités', resume TEXT, contenu TEXT,
      auteur TEXT DEFAULT 'ImmobilierCI', statut TEXT DEFAULT 'brouillon',
      image TEXT, tags TEXT, vues INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("✅ Schéma PostgreSQL créé");
}

// SQLite local inchangé
function _initSqlite() {
  require("./database_sqlite").initDb();
}

function prepare(sql) {
  if (isProd && _pg) {
    const pgSql = sqlToSnake(sql);
    let i = 0;
    const paramSql = pgSql.replace(/\?/g, () => `$${++i}`);
    return {
      async run(...params) {
        const isInsert = /^\s*INSERT/i.test(sql);
        const q = isInsert ? paramSql + " RETURNING id" : paramSql;
        const r = await _pg.query(q, params.map(v => v === undefined ? null : v));
        return {
          lastInsertRowid: r.rows[0]?.id || 0,
          changes: r.rowCount || 0,
        };
      },
      async get(...params) {
        const q = /LIMIT/i.test(paramSql) ? paramSql : paramSql + " LIMIT 1";
        const r = await _pg.query(q, params.map(v => v === undefined ? null : v));
        return r.rows[0] ? keysToCamel(r.rows[0]) : null;
      },
      async all(...params) {
        const r = await _pg.query(paramSql, params.map(v => v === undefined ? null : v));
        return r.rows.map(keysToCamel);
      },
    };
  }
  return require("./database_sqlite").prepare(sql);
}

async function exec(sql) {
  if (isProd && _pg) {
    await _pg.query(sqlToSnake(sql)).catch(() => {});
    return;
  }
  require("./database_sqlite").exec(sql);
}

module.exports = { prepare, exec, initDb };


