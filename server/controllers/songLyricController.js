import SongLyric from "../models/SongLyric.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
import { extractLyricsText, generateSongPPT, generateTxtToPPT } from "../utils/pptUtils.js";
import fs from "fs";
import { translate } from "@vitalets/google-translate-api";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";

/* =========================
   EXTRACT PREVIEW
========================= */
export const extractPreview = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Song file is required" });
    }

    // Check for duplicate file before extraction
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const existingByHash = await SongLyric.findOne({ fileHash });
    const existingByName = await SongLyric.findOne({ 
      originalFileName: req.file.originalname, 
      fileHash: { $exists: false } 
    });

    if (existingByHash || existingByName) {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(409).json({ exists: true, message: "This song file already exists." });
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
    const { songId, lyricsTamil } = req.body;
    
    // Exact requested validation code and message
    if (!lyricsTamil || typeof lyricsTamil !== 'string' || lyricsTamil.trim() === "") {
      return res.status(422).json({ 
        success: false, 
        message: "Tamil lyrics are required",
        code: "MISSING_LYRICS_TAMIL"
      });
    }

    let generatedThanglish = "";
    let errorReason = "";

    // 1. Try Gemini if configured
    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `Transliterate the following Tamil text into natural readable Thanglish using Latin characters. Do not translate the meaning. Preserve every line break and blank line exactly. Return only the transliterated text.
Tamil Text:
${lyricsTamil}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.1 }
        });
        
        if (response.text) {
           generatedThanglish = response.text.replace(/```[\s\S]*?\n/g, '').replace(/```/g, '').trim();
        }
      } catch (geminiError) {
        console.error("Gemini AI transliteration error:", geminiError);
        errorReason = "Gemini AI failed: " + geminiError.message;
      }
    } else {
      errorReason = "GEMINI_API_KEY environment variable is missing";
    }

    // 2. Fallback to direct Google Translate API (bypass library 429 blocks)
    if (!generatedThanglish) {
      try {
        const axios = (await import("axios")).default;
        const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ta&tl=en&dt=t&dt=rm&q=' + encodeURIComponent(lyricsTamil);
        const gtxRes = await axios.get(url, { timeout: 8000 });
        
        if (gtxRes.data && gtxRes.data[0]) {
          const segments = gtxRes.data[0];
          const translitSegment = segments.find(item => item[0] === null && typeof item[3] === 'string');
          if (translitSegment) {
            generatedThanglish = translitSegment[3];
          }
        }
      } catch (gtxError) {
        console.error("Google Translate Fallback error:", gtxError);
        errorReason = errorReason ? `${errorReason} | Google Translate API failed: ${gtxError.message}` : `Google Translate API failed: ${gtxError.message}`;
      }
    }

    if (!generatedThanglish) {
      return res.status(500).json({ 
        success: false, 
        message: "Failed to generate Thanglish. Configuration or API error.",
        reason: errorReason
      });
    }
    
    if (songId) {
      const song = await SongLyric.findById(songId);
      if (song) {
        song.lyricsThanglish = generatedThanglish;
        song.thanglishStatus = "available";
        song.thanglishSource = "generated";
        await song.save();
      }
    }

    return res.status(200).json({ 
      success: true, 
      data: { 
        lyricsThanglish: generatedThanglish, 
        titleEnglish: generatedThanglish
      } 
    });
  } catch (err) {
    console.error("Regenerate Thanglish error:", err);
    return res.status(500).json({ success: false, message: "Thanglish regeneration failed: " + err.message });
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

    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

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
      fileHash,
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

    const total = await SongLyric.countDocuments();

    return res.json({ success: true, data: songs, total });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================
   GET SINGLE SONG (FOR VIEWING LYRICS)
========================= */
export const getSongById = async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: "Invalid song ID." });
    }
    const song = await SongLyric.findById(req.params.id).lean();
    if (!song) return res.status(404).json({ success: false, message: "Song not found." });
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

      const fileBuffer = fs.readFileSync(req.file.path);
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      song.originalFileUrl = result.url;
      song.originalFileType = req.file.originalname.split('.').pop().toLowerCase();
      song.originalFileName = req.file.originalname;
      song.fileHash = fileHash;
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

/* =========================
   GENERATE TXT TO PPT
========================= */
export const generateTxtPPT = async (req, res) => {
  try {
    const song = await SongLyric.findById(req.params.id);
    if (!song) return res.status(404).json({ success: false, message: "Song not found" });

    if (!song.lyricsText || song.lyricsText.trim() === "") {
        return res.status(400).json({ success: false, message: "Song has no usable lyrics to generate PPT." });
    }

    const titleToUse = song.titleTamil || song.title || "Song";
    const language = req.query.language || 'tamil';
    
    // Stream the dynamically generated PPTX directly to the response
    await generateTxtToPPT(titleToUse, song.lyricsText, song.lyricsThanglish, language, res);
    
  } catch (err) {
    console.error("Error generating TXT PPT:", err);
    return res.status(500).json({ success: false, message: "Failed to generate PowerPoint from TXT" });
  }
};
