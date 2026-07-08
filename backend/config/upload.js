const multer = require("multer");
const path = require("path");
const fs = require("fs");
const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${Math.floor(Math.random()*99999)}${ext}`);
  },
});
const upload = multer({ storage, fileFilter: (_, f, cb) => cb(null, /image\/(jpeg|jpg|png|webp|gif)/.test(f.mimetype)), limits: { fileSize: 8*1024*1024, files: 10 } });

function photoUrl(filename) {
  if (!filename) return null;
  if (filename.startsWith("http") || filename.startsWith("data:")) return filename;
  const base = process.env.BACKEND_URL || `http://localhost:${process.env.PORT||3001}`;
  return `${base}/uploads/${filename}`;
}
function deleteFile(filename) {
  if (!filename || filename.startsWith("http") || filename.startsWith("data:")) return;
  try { fs.unlinkSync(path.join(UPLOAD_DIR, filename)); } catch {}
}
module.exports = { upload, photoUrl, deleteFile, UPLOAD_DIR };
