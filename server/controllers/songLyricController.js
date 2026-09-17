import SongLyric from "../models/SongLyric.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
import { extractLyricsText, generateSongPPT } from "../utils/pptUtils.js";
import fs from "fs";
import { translate } from "@vitalets/google-translate-api";

/* =========================
   EXTRACT PREVIEW
========================= */
export const extractPreview = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Song file is required" });
    }

    let lyricsText = "";
    try {
      lyricsText = await extractLyricsText(req.file.path);
    } catch (e) {
      console.error("Extraction failed:", e);
      // Fail gracefully: empty lyrics, needs review
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(200).json({
        success: true,
        data: {
          lyricsTamil: "",
          lyricsThanglish: "",
          thanglishStatus: "needs_review",
          thanglishSource: "manual" // Admin will have to type it manually
        }
      });
    }

    let lyricsTamil = "";
    let lyricsThanglish = "";
    let thanglishStatus = "needs_review";
    let thanglishSource = "manual";

    const hasTamil = /[\u0B80-\u0BFF]/.test(lyricsText);
    const hasEnglish = /[a-zA-Z]/.test(lyricsText);

    if (hasTamil && !hasEnglish) {
      // Case 1: Only Tamil
      lyricsTamil = lyricsText;
      try {
        const transResult = await translate(lyricsText, { to: 'en' });
        if (transResult.raw && transResult.raw.sentences) {
            const translitObj = transResult.raw.sentences.find(s => s.src_translit);
            if (translitObj) {
                lyricsThanglish = translitObj.src_translit;
                thanglishStatus = "available";
                thanglishSource = "generated";
            }
        }
      } catch (e) {
        console.error("Transliteration failed:", e);
        // Fallback handled nicely
        thanglishStatus = "needs_review";
      }
    } else if (!hasTamil && hasEnglish) {
      // Case 3: Only English/Thanglish
      lyricsThanglish = lyricsText;
      thanglishStatus = "available";
      thanglishSource = "extracted";
    } else if (hasTamil && hasEnglish) {
      // Case 2: Contains both
      lyricsTamil = lyricsText;
      thanglishStatus = "available";
      thanglishSource = "extracted";
    } else {
      // Fallback
      lyricsTamil = lyricsText;
    }

    // Clean up file since it's just a preview
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(200).json({ success: true, data: { lyricsTamil, lyricsThanglish, thanglishStatus, thanglishSource } });
  } catch (err) {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   REGENERATE THANGLISH
========================= */
export const regenerateThanglish = async (req, res) => {
  try {
    const { lyricsTamil } = req.body;
    if (!lyricsTamil) {
       return res.status(400).json({ success: false, message: "Tamil lyrics are required" });
    }

    let generatedThanglish = "";
    const transResult = await translate(lyricsTamil, { to: 'en' });
    if (transResult.raw && transResult.raw.sentences) {
        const translitObj = transResult.raw.sentences.find(s => s.src_translit);
        if (translitObj) {
            generatedThanglish = translitObj.src_translit;
        }
    }

    if (!generatedThanglish) {
      throw new Error("Transliteration service returned empty output");
    }

    return res.status(200).json({ success: true, data: { lyricsThanglish: generatedThanglish } });
  } catch (err) {
    console.error("Regenerate Thanglish error:", err);
    return res.status(500).json({ success: false, message: "Thanglish regeneration failed." });
  }
};

/* =========================
   UPLOAD SONG
========================= */
export const uploadSong = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Song file is required" });
    }
    
    const { titleTamil, titleEnglish, lyricsText, lyricsThanglish, thanglishStatus, thanglishSource } = req.body;

    if (!titleTamil || !titleEnglish) {
       return res.status(400).json({ success: false, message: "Both Tamil and English titles are required" });
    }

    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tamilRegex = new RegExp(`^${escapeRegex(titleTamil.trim())}$`, 'i');
    const englishRegex = new RegExp(`^${escapeRegex(titleEnglish.trim())}$`, 'i');

    const duplicateSong = await SongLyric.findOne({
      $or: [
        { titleTamil: tamilRegex },
        { titleEnglish: englishRegex },
        { title: tamilRegex },
        { titleEnglish: tamilRegex },
        { titleTamil: englishRegex }
      ]
    });

    if (duplicateSong) {
      return res.status(409).json({ success: false, message: "This song name already exists. Please use a different song name." });
    }

    // 1. Upload original file to Cloudinary as raw
    const result = await uploadToCloudinary(req.file.path, {
      folder: "mtc-padikuppam/song-lyrics",
      resource_type: "raw", // important for ppt/txt
    });

    // 2. Save to DB
    const song = await SongLyric.create({
      title: titleTamil, // fallback
      normalizedTitle: titleTamil.toLowerCase(),
      titleTamil,
      titleEnglish,
      lyricsText: lyricsText || "",
      lyricsThanglish: lyricsThanglish || "",
      thanglishStatus: thanglishStatus || "needs_review",
      thanglishSource: thanglishSource || "manual",
      originalFileUrl: result.url,
      originalFileType: req.file.originalname.split('.').pop().toLowerCase(),
      originalFileName: req.file.originalname,
    });

    return res.status(201).json({ success: true, data: song });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    }
  }
};

/* =========================
   GET ALL SONGS (WITH SEARCH & SORT)
========================= */
export const getSongs = async (req, res) => {
  try {
    const { search, sort = "newest" } = req.query;
    let query = {};
    
    if (search) {
       query = {
         $or: [
           { title: { $regex: search, $options: "i" } },
           { normalizedTitle: { $regex: search, $options: "i" } },
           { titleTamil: { $regex: search, $options: "i" } },
           { titleEnglish: { $regex: search, $options: "i" } }
         ]
       };
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "alphabetical") sortOption = { titleEnglish: 1, titleTamil: 1, title: 1 }; 

    const songs = await SongLyric.find(query)
      .select("-lyricsText -lyricsThanglish") // Exclude heavy text payload
      .sort(sortOption)
      .lean();

    return res.json({ success: true, data: songs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   GET SINGLE SONG (FOR VIEWING LYRICS)
========================= */
export const getSongById = async (req, res) => {
  try {
    const song = await SongLyric.findById(req.params.id).lean();
    if (!song) return res.status(404).json({ success: false, message: "Song not found" });
    return res.json({ success: true, data: song });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   UPDATE SONG (TITLE OR REPLACE FILE)
========================= */
export const updateSong = async (req, res) => {
  try {
    const song = await SongLyric.findById(req.params.id);
    if (!song) return res.status(404).json({ success: false, message: "Song not found" });

    const { titleTamil, titleEnglish, lyricsText, lyricsThanglish, thanglishStatus, thanglishSource } = req.body;

    if (titleTamil && titleEnglish) {
      const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const tamilRegex = new RegExp(`^${escapeRegex(titleTamil.trim())}$`, 'i');
      const englishRegex = new RegExp(`^${escapeRegex(titleEnglish.trim())}$`, 'i');

      const duplicateSong = await SongLyric.findOne({
        _id: { $ne: req.params.id },
        $or: [
          { titleTamil: tamilRegex },
          { titleEnglish: englishRegex },
          { title: tamilRegex },
          { titleEnglish: tamilRegex },
          { titleTamil: englishRegex }
        ]
      });

      if (duplicateSong) {
        return res.status(409).json({ success: false, message: "This song name already exists. Please use a different song name." });
      }
    }

    // Update fields if provided
    if (titleTamil) {
       song.title = titleTamil;
       song.normalizedTitle = titleTamil.toLowerCase();
       song.titleTamil = titleTamil;
    }
    if (titleEnglish) song.titleEnglish = titleEnglish;
    if (lyricsText !== undefined) song.lyricsText = lyricsText;
    if (lyricsThanglish !== undefined) song.lyricsThanglish = lyricsThanglish;
    if (thanglishStatus) song.thanglishStatus = thanglishStatus;
    if (thanglishSource) song.thanglishSource = thanglishSource;

    // Replace file if provided
    if (req.file) {
      // 1. Delete old file from Cloudinary
      if (song.originalFileUrl && song.originalFileUrl.includes('cloudinary')) {
          const publicId = song.originalFileUrl.split('/').slice(-2).join('/').split('.')[0];
          await deleteFromCloudinary(publicId, "raw").catch(e => console.error("Cloudinary delete failed", e));
      }

      // 2. Upload new file
      const result = await uploadToCloudinary(req.file.path, {
        folder: "mtc-padikuppam/song-lyrics",
        resource_type: "raw",
      });

      song.originalFileUrl = result.url;
      song.originalFileType = req.file.originalname.split('.').pop().toLowerCase();
      song.originalFileName = req.file.originalname;
    }

    await song.save();

    return res.json({ success: true, data: song });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Cleanup error:", e);
      }
    }
  }
};

/* =========================
   DELETE SONG
========================= */
export const deleteSong = async (req, res) => {
  try {
    const song = await SongLyric.findById(req.params.id);
    if (!song) return res.status(404).json({ success: false, message: "Song not found" });

    if (song.originalFileUrl && song.originalFileUrl.includes('cloudinary')) {
        const publicId = song.originalFileUrl.split('/').slice(-2).join('/').split('.')[0];
        await deleteFromCloudinary(publicId, "raw").catch(e => console.error("Cloudinary delete failed", e));
    }

    await song.deleteOne();
    return res.json({ success: true, message: "Song deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   DOWNLOAD GENERATED PPT
========================= */
export const downloadSongPPT = async (req, res) => {
  try {
    const song = await SongLyric.findById(req.params.id);
    if (!song) return res.status(404).json({ success: false, message: "Song not found" });

    // Stream the dynamically generated PPTX directly to the response
    await generateSongPPT(song.title, song.lyricsText, res);
    
  } catch (err) {
    console.error("Error generating PPT:", err);
    return res.status(500).json({ success: false, message: "Failed to generate PowerPoint" });
  }
};
