require("dotenv").config();
const express=require("express");
const cors=require("cors");
const cookieParser=require("cookie-parser");
const path=require("path");
const {initDb}=require("./config/database");

const app=express();
const PORT=process.env.PORT||3001;
const isProd = process.env.NODE_ENV === "production";

// ── 1. Forcer HTTPS en production ─────────────────────────────────
// Sur cPanel/la plupart des hébergeurs, l'app Node tourne derrière un
// proxy (Apache/Nginx) qui gère le certificat SSL. On fait confiance à
// l'en-tête x-forwarded-proto pour détecter le protocole d'origine et
// rediriger toute requête HTTP vers son équivalent HTTPS.
app.set("trust proxy", 1);
if (isProd) {
  app.use((req, res, next) => {
    const proto = req.headers["x-forwarded-proto"] || req.protocol;
    if (proto !== "https") {
      return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
    }
    next();
  });
}

// ── 2. Headers de sécurité (équivalent helmet, sans dépendance) ───
app.use((req, res, next) => {
  // Empêche le navigateur de deviner un type de contenu différent (anti-sniffing)
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Empêche l'affichage du site dans une iframe étrangère (anti-clickjacking)
  res.setHeader("X-Frame-Options", "DENY");
  // Active la protection XSS des anciens navigateurs (sans effet sur les récents, sans risque)
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // N'envoie jamais l'URL complète comme referrer à un site tiers
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Force HTTPS pendant 1 an, y compris sous-domaines, une fois activé par le navigateur
  if (isProd) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  // Interdit l'utilisation abusive de caméra/micro/géoloc par des scripts tiers
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  next();
});

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = [
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
      /\.vercel\.app$/,
      /\.railway\.app$/,
    ];
    const extra = (process.env.FRONTEND_URL || "").split(",").map(u => u.trim()).filter(Boolean);
    if (allowed.some(r => typeof r === 'string' ? r === origin : r.test(origin)) || extra.includes(origin)) {
      return callback(null, true);
    }
    console.warn("CORS bloqué pour:", origin);
    return callback(new Error("CORS bloqué : " + origin));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.use(express.json({limit:"25mb"}));
app.use(express.urlencoded({extended:true,limit:"25mb"}));
app.use(cookieParser());
app.use("/uploads",(_, res, next)=>{res.header("Access-Control-Allow-Origin","*");next();},express.static(path.join(__dirname,"uploads")));

app.use("/api/auth",    require("./routes/auth"));
app.use("/api/biens",   require("./routes/biens"));
app.use("/api/clients", require("./routes/clients"));
app.use("/api/loyers",  require("./routes/loyers"));
app.use("/api/ventes",  require("./routes/ventes"));
app.use("/api/demandes",require("./routes/demandes"));
app.use("/api/contrats",require("./routes/contrats"));
app.use("/api/visites", require("./routes/visites"));
app.use("/api/stats",        require("./routes/stats"));
app.use("/api/articles",     require("./routes/articles"));
app.use("/api/temoignages",  require("./routes/temoignages"));
app.use("/api/realisations", require("./routes/realisations"));
app.use("/api/users",        require("./routes/users"));
app.use("/api/documents",    require("./routes/documents"));
// Le sitemap est servi à la racine (/sitemap.xml), pas sous /api — c'est
// l'emplacement standard que les moteurs de recherche s'attendent à trouver.
app.use("/", require("./routes/sitemap"));
app.use("/api/settings", require("./routes/settings"));
app.get("/api/health",(_,res)=>res.json({status:"ok",version:"3.0.0",timestamp:new Date().toISOString()}));

app.use((err,req,res,_)=>{
  if(err.code==="LIMIT_FILE_SIZE") return res.status(400).json({error:"Fichier trop volumineux (max 8Mo)"});
  res.status(err.status||500).json({error:err.message||"Erreur serveur"});
});

// Servir le frontend React depuis backend/public
const PUBLIC = require("path").join(__dirname, "public");
if (require("fs").existsSync(PUBLIC)) {
  app.use(express.static(PUBLIC));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(require("path").join(PUBLIC, "index.html"));
  });
  console.log("✅ Frontend servi depuis backend/public");
}

initDb().then(()=>{
  app.listen(PORT,()=>{
    console.log(`✅  ImmobilierCI API  →  http://localhost:${PORT}`);
    console.log(`📁  Photos  →  http://localhost:${PORT}/uploads`);
    if (isProd) console.log(`🔒  HTTPS forcé (NODE_ENV=production)`);
    else console.log(`⚠️  NODE_ENV n'est pas "production" — HTTPS non forcé. Mettez NODE_ENV=production sur votre hébergement.`);
  });
}).catch(e=>{console.error("❌",e.message);process.exit(1);});

