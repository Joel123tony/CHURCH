import multer from "multer";
import os from "os";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Be careful with originalname to preserve extensions like .pptx
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_"));
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Checking both extension and mimetype because some browsers send generic mimetypes for PPTs
  const allowedExtensions = [".txt", ".ppt", ".pptx"];
  const allowedMimeTypes = [
    "text/plain",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ];

  if (!allowedExtensions.includes(ext) && !allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new Error("Only TXT, PPT, and PPTX files are allowed for Song Lyrics"),
      false
    );
  }

  cb(null, true);
};

const uploadLyrics = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max limit
  }
});

export default uploadLyrics;
