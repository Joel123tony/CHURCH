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

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "coverImage") {
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, JPEG, PNG, and WEBP images are allowed for the book cover."),
        false
      );
    }
  } else if (file.fieldname === "pdfFile") {
    if (file.mimetype !== "application/pdf") {
      return cb(
        new Error("Only PDF files are allowed for books."),
        false
      );
    }
  } else {
    return cb(new Error("Unexpected field"), false);
  }

  cb(null, true);
};

const bookUpload = multer({
  storage,
  fileFilter,
});

export default bookUpload;
