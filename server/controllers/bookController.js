import Book from "../models/Book.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

/* =========================
  CREATE BOOK
========================= */
export const createBook = async (req, res) => {
  try {
    if (!req.files || !req.files.pdfFile || !req.files.pdfFile[0]) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    if (!req.files.coverImage || !req.files.coverImage[0]) {
      return res.status(400).json({
        success: false,
        message: "Cover image is required",
      });
    }

    const { title, date } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Derive a safe filename from the original upload or the title
    const pdfOriginalName = req.files.pdfFile[0].originalname || "book.pdf";
    const safePdfName = pdfOriginalName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .replace(/\.pdf$/i, ""); // Remove .pdf temporarily

    // Upload PDF — enforce resource_type: "raw" and include .pdf in public_id
    const pdfUpload = await uploadToCloudinary(req.files.pdfFile[0].buffer, {
      folder: "church-books/pdfs",
      resource_type: "raw",
      public_id: safePdfName + "_" + Date.now() + ".pdf",
    });

    // Upload Cover Image
    const coverUpload = await uploadToCloudinary(req.files.coverImage[0].buffer, {
      folder: "church-books/covers",
      resource_type: "image",
    });

    // Validate the PDF URL before saving
    const finalPdfUrl = pdfUpload.url || pdfUpload.secure_url;
    console.log("📄 PDF stored at:", finalPdfUrl);
    console.log("📄 PDF public_id:", pdfUpload.public_id);

    const book = await Book.create({
      title,
      date: date || "",
      pdfUrl: finalPdfUrl,
      pdf_public_id: pdfUpload.public_id,
      coverImageUrl: coverUpload.url || coverUpload.secure_url,
      cover_public_id: coverUpload.public_id,
    });

    return res.status(201).json({
      success: true,
      book,
    });
  } catch (err) {
    console.error("CREATE BOOK ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create book",
    });
  }
};

/* =========================
  GET ALL BOOKS
========================= */
export const getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      books,
    });
  } catch (err) {
    console.error("GET BOOKS ERROR:", err);
    return res.status(500).json({
      success: false,
      books: [],
      message: err.message,
    });
  }
};

/* =========================
  UPDATE BOOK
========================= */
export const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const { title, date } = req.body;
    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (date !== undefined) updatePayload.date = date;

    if (req.files) {
      // Update PDF if provided
      if (req.files.pdfFile && req.files.pdfFile[0]) {
        if (book.pdf_public_id) {
          const rType = book.pdfUrl && book.pdfUrl.includes('/raw/') ? "raw" : "image";
          await deleteFromCloudinary(book.pdf_public_id, rType);
        }
        const pdfOriginalName = req.files.pdfFile[0].originalname || "book.pdf";
        const safePdfName = pdfOriginalName
          .replace(/[^a-zA-Z0-9._-]/g, "_")
          .replace(/\.pdf$/i, "");

        const pdfUpload = await uploadToCloudinary(req.files.pdfFile[0].buffer, {
          folder: "church-books/pdfs",
          resource_type: "raw",
          public_id: safePdfName + "_" + Date.now() + ".pdf",
        });
        updatePayload.pdfUrl = pdfUpload.url || pdfUpload.secure_url;
        updatePayload.pdf_public_id = pdfUpload.public_id;
        console.log("📄 Updated PDF stored at:", updatePayload.pdfUrl);
      }

      // Update Cover Image if provided
      if (req.files.coverImage && req.files.coverImage[0]) {
        if (book.cover_public_id) {
          await deleteFromCloudinary(book.cover_public_id);
        }
        const coverUpload = await uploadToCloudinary(req.files.coverImage[0].buffer, {
          folder: "church-books/covers",
          resource_type: "image",
        });
        updatePayload.coverImageUrl = coverUpload.url || coverUpload.secure_url;
        updatePayload.cover_public_id = coverUpload.public_id;
      }
    }

    const updated = await Book.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      book: updated,
    });
  } catch (err) {
    console.error("UPDATE BOOK ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update book",
    });
  }
};

/* =========================
  DELETE BOOK
========================= */
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.pdf_public_id) {
      const rType = book.pdfUrl && book.pdfUrl.includes('/raw/') ? "raw" : "image";
      await deleteFromCloudinary(book.pdf_public_id, rType);
    }
    if (book.cover_public_id) {
      await deleteFromCloudinary(book.cover_public_id);
    }

    await Book.deleteOne({ _id: req.params.id });

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
