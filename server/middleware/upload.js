import multer from "multer";
import os from "os";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"));
  }
});

/* =========================
   FILE FILTER (FIXED)
   supports image + video
========================= */
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/mov",
    "video/quicktime",
    "video/x-msvideo", // avi
    "video/x-matroska", // mkv
    "video/webm",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only images (JPG, PNG, WEBP) or videos (MP4, MOV, AVI, MKV, WEBM) allowed"),
      false
    );
  }

  cb(null, true);
};

/* =========================
   MULTER CONFIG
========================= */
const upload = multer({
  storage,
  fileFilter,
});

export default upload;
