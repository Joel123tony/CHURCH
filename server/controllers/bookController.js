import Book from "../models/Book.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
import { getCached, setCached, clearCache } from "../utils/cache.js";
import { compressImage, compressPdf } from "../utils/compressMedia.js";
import fs from "fs";

const CACHE_KEY = "books_all";

/* =========================
  CREATE BOOK
========================= */
export const createBook = async (req, res) => {
  let optimizedPdfPath = null;
  let optimizedCoverPath = null;

  try {
    console.log("=== CREATE BOOK TRACE START ===");
    console.log("Req Body:", JSON.stringify({ ...req.body, pdfFile: undefined }));
    console.log("Req Files:", req.files ? Object.keys(req.files) : "none");

    if (!req.files || !req.files.pdfFile || !req.files.pdfFile[0]) {
      console.log("Error: PDF file is missing");
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    if (!req.files.coverImage && !req.body.coverImageUrl) {
      console.log("Error: Cover image is missing");
      return res.status(400).json({
        success: false,
        message: "Cover image is required",
      });
    }

    const { title, date, author, category } = req.body;
    
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

    // COMPRESS PDF
    console.log("Compressing PDF...");
    let pdfUploadPath = req.files.pdfFile[0].path;
    try {
      const pdfCompResult = await compressPdf(pdfUploadPath);
      if (pdfCompResult.isCompressed) {
        optimizedPdfPath = pdfCompResult.filePath;
        pdfUploadPath = optimizedPdfPath;
        console.log(`PDF Compressed: ${pdfCompResult.originalSize} -> ${pdfCompResult.compressedSize}`);
      } else {
        console.log("PDF compression skipped or not beneficial.");
      }
    } catch (compErr) {
      console.error("PDF compression failed, using original:", compErr);
    }

    // Upload PDF — enforce resource_type: "raw" and include .pdf in public_id
    console.log("Uploading PDF to Cloudinary...");
    let pdfUpload;
    try {
      pdfUpload = await uploadToCloudinary(pdfUploadPath, {
        folder: "mtc-padikuppam/books/pdfs",
        resource_type: "raw",
        public_id: safePdfName + "_" + Date.now() + ".pdf",
      });
      console.log("PDF Upload Success:", pdfUpload.secure_url || pdfUpload.url);
    } catch (uploadErr) {
      console.error("PDF Cloudinary Upload Failed:", uploadErr);
      return res.status(500).json({
        success: false,
        message: "Failed to upload PDF to Cloudinary: " + uploadErr.message
      });
    }

    // Upload Cover Image (or use pre-uploaded URL)
    let coverUrl = req.body.coverImageUrl;
    let coverPublicId = req.body.cover_public_id || null;

    if (req.files.coverImage && req.files.coverImage[0]) {
      // COMPRESS COVER
      console.log("Compressing Cover Image...");
      let coverUploadPath = req.files.coverImage[0].path;
      try {
        const coverCompResult = await compressImage(coverUploadPath);
        if (coverCompResult.isCompressed) {
          optimizedCoverPath = coverCompResult.filePath;
          coverUploadPath = optimizedCoverPath;
          console.log(`Cover Compressed: ${coverCompResult.originalSize} -> ${coverCompResult.compressedSize}`);
        } else {
          console.log("Cover compression skipped or not beneficial.");
        }
      } catch (compErr) {
        console.error("Cover compression failed, using original:", compErr);
      }

      console.log("Uploading Cover to Cloudinary...");
      try {
        const coverUpload = await uploadToCloudinary(coverUploadPath, {
          folder: "mtc-padikuppam/books/covers",
          resource_type: "image",
        });
        coverUrl = coverUpload.url || coverUpload.optimized_url;
        coverPublicId = coverUpload.public_id;
        console.log("Cover Upload Success:", coverUrl);
      } catch (uploadErr) {
        console.error("Cover Cloudinary Upload Failed:", uploadErr);
        return res.status(500).json({
          success: false,
          message: "Failed to upload cover to Cloudinary: " + uploadErr.message
        });
      }
    }

    // Validate the PDF URL before saving
    const finalPdfUrl = pdfUpload.url || pdfUpload.optimized_url;
    console.log("📄 PDF stored at:", finalPdfUrl);
    console.log("📄 PDF public_id:", pdfUpload.public_id);

    console.log("Saving Book to MongoDB...");
    let book;
    try {
      book = await Book.create({
        title,
        date: date || "",
        author: author || "",
        category: category || "Pamphlet",
        pdfUrl: finalPdfUrl,
        pdf_public_id: pdfUpload.public_id,
        coverImageUrl: coverUrl,
        cover_public_id: coverPublicId,
      });
      console.log("MongoDB Save Success:", book._id);
    } catch (dbErr) {
      console.error("MongoDB Save Failed:", dbErr);
      return res.status(400).json({
        success: false,
        message: "Database Error: " + (dbErr.message || "Failed to save book")
      });
    }
    
    clearCache(CACHE_KEY);

    console.log("=== CREATE BOOK TRACE END ===");
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
  } finally {
    // Cleanup temporary files
    if (req.files?.pdfFile?.[0]?.path && fs.existsSync(req.files.pdfFile[0].path)) {
      try { fs.unlinkSync(req.files.pdfFile[0].path); } catch (e) { console.error(e); }
    }
    if (req.files?.coverImage?.[0]?.path && fs.existsSync(req.files.coverImage[0].path)) {
      try { fs.unlinkSync(req.files.coverImage[0].path); } catch (e) { console.error(e); }
    }
    if (optimizedPdfPath && fs.existsSync(optimizedPdfPath)) {
      try { fs.unlinkSync(optimizedPdfPath); } catch (e) { console.error(e); }
    }
    if (optimizedCoverPath && fs.existsSync(optimizedCoverPath)) {
      try { fs.unlinkSync(optimizedCoverPath); } catch (e) { console.error(e); }
    }
  }
};


/* =========================
  GET ALL BOOKS
========================= */
export const getBooks = async (req, res) => {
  try {
    const cachedData = getCached(CACHE_KEY);
    if (cachedData) {
      return res.json({ success: true, books: cachedData });
    }

    const books = await Book.find().sort({ createdAt: -1 }).lean();
    
    setCached(CACHE_KEY, books, 60);

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
  let optimizedPdfPath = null;
  let optimizedCoverPath = null;

  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const { title, date, author, category } = req.body;
    const updatePayload = {};
    if (title !== undefined) updatePayload.title = title;
    if (date !== undefined) updatePayload.date = date;
    if (author !== undefined) updatePayload.author = author;
    if (category !== undefined) updatePayload.category = category;

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

        // COMPRESS PDF
        console.log("Compressing updated PDF...");
        let pdfUploadPath = req.files.pdfFile[0].path;
        try {
          const pdfCompResult = await compressPdf(pdfUploadPath);
          if (pdfCompResult.isCompressed) {
            optimizedPdfPath = pdfCompResult.filePath;
            pdfUploadPath = optimizedPdfPath;
            console.log(`Updated PDF Compressed: ${pdfCompResult.originalSize} -> ${pdfCompResult.compressedSize}`);
          }
        } catch (compErr) {
          console.error("PDF compression failed, using original:", compErr);
        }

        const pdfUpload = await uploadToCloudinary(pdfUploadPath, {
          folder: "mtc-padikuppam/books/pdfs",
          resource_type: "raw",
          public_id: safePdfName + "_" + Date.now() + ".pdf",
        });
        updatePayload.pdfUrl = pdfUpload.url || pdfUpload.optimized_url;
        updatePayload.pdf_public_id = pdfUpload.public_id;
        console.log("📄 Updated PDF stored at:", updatePayload.pdfUrl);
      }

      // Update Cover Image if provided
      if (req.files.coverImage && req.files.coverImage[0]) {
        if (book.cover_public_id) {
          await deleteFromCloudinary(book.cover_public_id);
        }
        
        // COMPRESS COVER
        console.log("Compressing updated Cover Image...");
        let coverUploadPath = req.files.coverImage[0].path;
        try {
          const coverCompResult = await compressImage(coverUploadPath);
          if (coverCompResult.isCompressed) {
            optimizedCoverPath = coverCompResult.filePath;
            coverUploadPath = optimizedCoverPath;
            console.log(`Updated Cover Compressed: ${coverCompResult.originalSize} -> ${coverCompResult.compressedSize}`);
          }
        } catch (compErr) {
          console.error("Cover compression failed, using original:", compErr);
        }

        const coverUpload = await uploadToCloudinary(coverUploadPath, {
          folder: "mtc-padikuppam/books/covers",
          resource_type: "image",
        });
        updatePayload.coverImageUrl = coverUpload.url || coverUpload.optimized_url;
        updatePayload.cover_public_id = coverUpload.public_id;
      }
    }

    if (req.body.coverImageUrl) {
      updatePayload.coverImageUrl = req.body.coverImageUrl;
      if (req.body.cover_public_id) {
        updatePayload.cover_public_id = req.body.cover_public_id;
      }
    }

    const updated = await Book.findByIdAndUpdate(req.params.id, updatePayload, {
      returnDocument: 'after',
      runValidators: true,
      lean: true
    });

    clearCache(CACHE_KEY);

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
  } finally {
    // Cleanup temporary files
    if (req.files?.pdfFile?.[0]?.path && fs.existsSync(req.files.pdfFile[0].path)) {
      try { fs.unlinkSync(req.files.pdfFile[0].path); } catch (e) { console.error(e); }
    }
    if (req.files?.coverImage?.[0]?.path && fs.existsSync(req.files.coverImage[0].path)) {
      try { fs.unlinkSync(req.files.coverImage[0].path); } catch (e) { console.error(e); }
    }
    if (optimizedPdfPath && fs.existsSync(optimizedPdfPath)) {
      try { fs.unlinkSync(optimizedPdfPath); } catch (e) { console.error(e); }
    }
    if (optimizedCoverPath && fs.existsSync(optimizedCoverPath)) {
      try { fs.unlinkSync(optimizedCoverPath); } catch (e) { console.error(e); }
    }
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

    clearCache(CACHE_KEY);

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
