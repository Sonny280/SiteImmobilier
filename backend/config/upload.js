// config/upload.js — Cloudinary en production, local en développement
const path = require("path");
const fs   = require("fs");

const isProd = !!process.env.CLOUDINARY_CLOUD_NAME;

// ── Cloudinary (production) ───────────────────────────────────
let cloudinary = null;
if (isProd) {
  cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure:     true,
  });
  console.log("✅ Cloudinary configuré");
}

// ── Local (développement) ─────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Upload une image base64 vers Cloudinary ou local
async function uploadBase64(base64Data, filename) {
  if (isProd && cloudinary) {
    const result = await cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Data}`,
      {
        folder: "immobilierci",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      }
    );
    return { url: result.secure_url, filename: result.public_id };
  }
  // Local
  const localPath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(localPath, Buffer.from(base64Data, "base64"));
  return { url: photoUrl(filename), filename };
}

// Upload un fichier via multer vers Cloudinary ou local
async function uploadFile(filePath, originalFilename) {
  if (isProd && cloudinary) {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "immobilierci",
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    // Supprimer le fichier temporaire local
    fs.unlink(filePath, () => {});
    return { url: result.secure_url, filename: result.public_id };
  }
  return { url: photoUrl(path.basename(filePath)), filename: path.basename(filePath) };
}

// Supprimer une image
async function deleteFile(filename) {
  if (!filename) return;
  if (isProd && cloudinary && !filename.startsWith("http")) {
    await cloudinary.uploader.destroy(filename).catch(() => {});
    return;
  }
  if (isProd && cloudinary && filename.includes("immobilierci/")) {
    const publicId = filename.split("/upload/")[1]?.replace(/\.[^/.]+$/, "");
    if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {});
    return;
  }
  // Local
  try {
    const fp = path.join(UPLOAD_DIR, filename);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  } catch {}
}

function photoUrl(filename) {
  if (!filename) return null;
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT||3001}`;
  return `${base}/uploads/${filename}`;
}

// Multer pour les uploads multipart (garde la compatibilité)
const multer = require("multer");
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.floor(Math.random()*99999)}${ext}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (_, f, cb) => cb(null, /image\/(jpeg|jpg|png|webp|gif)/.test(f.mimetype)),
  limits: { fileSize: 8*1024*1024, files: 10 },
});

module.exports = { upload, photoUrl, deleteFile, uploadBase64, uploadFile, UPLOAD_DIR };


