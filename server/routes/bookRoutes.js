import express from "express";
import {
  createBook,
  getBooks,
  updateBook,
  deleteBook,
} from "../controllers/bookController.js";
import bookUpload from "../middleware/bookUpload.js";

const router = express.Router();

const uploadFields = bookUpload.fields([
  { name: "coverImage", maxCount: 1 },
  { name: "pdfFile", maxCount: 1 }
]);

router.post("/", uploadFields, createBook);
router.get("/", getBooks);
router.put("/:id", uploadFields, updateBook);
router.delete("/:id", deleteBook);

export default router;
