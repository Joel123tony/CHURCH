import multer from "multer";

const storage = multer.memoryStorage();

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
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only images (JPG, PNG, WEBP) or videos (MP4, MOV) allowed"),
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
