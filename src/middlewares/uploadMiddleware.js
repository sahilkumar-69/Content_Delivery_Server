import fs from "fs";
import path from "path";
import multer from "multer";

// we use absolute path to ensure it works regardless of where the server is started from

const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    cb(null, safeName);
  },
});

const allowedMimes = ["image/jpeg", "image/png", "image/gif"];
const maxBytes = Number(process.env.MAX_UPLOAD_SIZE_MB || 10) * 1024 * 1024; // limit to 10mb as asked in the task description

export const uploadContentFile = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimes.includes(file.mimetype)) {
      cb(new Error("Only jpg, png, and gif files are allowed"));
      return;
    }

    cb(null, true);
  },
});
