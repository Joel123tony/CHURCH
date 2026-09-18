import officeParser from "officeparser"; // Keeping for .ppt fallback if needed
import AdmZip from "adm-zip";
import { parseStringPromise } from "xml2js";
import pptxgen from "pptxgenjs";
import fs from "fs/promises";
import path from "path";

/**
 * Extracts text from a PPTX file using adm-zip and xml2js.
 * This is highly robust for Tamil/Unicode characters and ignores images/shapes without text.
 */
const extractPptxTextRobust = async (filePath) => {
  const zip = new AdmZip(filePath);
  const zipEntries = zip.getEntries();
  
  // Find all slide XML files
  const slideEntries = zipEntries.filter(entry => 
    entry.entryName.startsWith("ppt/slides/slide") && entry.entryName.endsWith(".xml")
  );

  if (slideEntries.length === 0) {
    throw new Error("No slides found in the PowerPoint file.");
  }

  // Sort slides numerically (slide1.xml, slide2.xml, ..., slide10.xml)
  slideEntries.sort((a, b) => {
    const numA = parseInt(a.entryName.match(/slide(\d+)\.xml/)?.[1] || "0");
    const numB = parseInt(b.entryName.match(/slide(\d+)\.xml/)?.[1] || "0");
    return numA - numB;
  });

  let fullText = "";

  for (const entry of slideEntries) {
    const xmlData = entry.getData().toString("utf8");
    const result = await parseStringPromise(xmlData);
    
    let slideText = "";

    // Helper to recursively find all <a:t> (text) nodes inside <a:p>
    const extractTextNodes = (node) => {
      if (typeof node === "string") return;
      if (Array.isArray(node)) {
        for (const item of node) {
          extractTextNodes(item);
        }
      } else if (typeof node === "object" && node !== null) {
        for (const key in node) {
          if (key === "a:p") {
             const pNodes = Array.isArray(node[key]) ? node[key] : [node[key]];
             for (const p of pNodes) {
                extractTextNodes(p);
                slideText += "\n"; // Paragraph break
             }
          } else if (key === "a:t") {
             const tNodes = Array.isArray(node[key]) ? node[key] : [node[key]];
             for (const t of tNodes) {
                if (typeof t === "string") slideText += t;
                else if (t && typeof t === "object" && t._) slideText += t._;
             }
          } else {
             extractTextNodes(node[key]);
          }
        }
      }
    };

    extractTextNodes(result);
    
    // Clean up slide text (remove excessive newlines but preserve stanza breaks)
    slideText = slideText.replace(/\n{3,}/g, '\n\n').trim();
    
    if (slideText) {
      fullText += slideText + "\n\n";
    }
  }

  return fullText.trim();
};

export const extractLyricsText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === ".txt") {
      const text = await fs.readFile(filePath, "utf-8");
      return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    } else if (ext === ".pptx") {
      // Use our robust unicode-safe custom extractor for PPTX
      const text = await extractPptxTextRobust(filePath);
      
      if (!text || text.trim().length === 0) {
         throw new Error("Empty text extracted");
      }
      return text;
    } else if (ext === ".ppt") {
      // Fallback to officeparser for older .ppt files (binary format)
      const text = await officeParser.parseOfficeAsync(filePath);
      
      if (!text || text.trim().length === 0) {
         throw new Error("Empty text extracted");
      }
      return text.replace(/\n{3,}/g, '\n\n').trim();
    } else {
      throw new Error("Unsupported file type for extraction");
    }
  } catch (error) {
    console.error("Error extracting lyrics:", error);
    // Let the original error message pass through if it's our own
    if (error.message === "Empty text extracted" || error.message.includes("No slides found")) {
      throw new Error("Unable to extract lyrics from this PowerPoint file. Please check that the file contains selectable text.");
    }
    throw new Error("Unable to extract lyrics from this PowerPoint file. Please check that the file contains selectable text.");
  }
};

export const generateSongPPT = async (title, lyricsText, res) => {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  // Title Slide
  const slide1 = pptx.addSlide();
  slide1.background = { color: '5d1324' }; // MTC Primary Color
  slide1.addText(title, {
    x: '10%', y: '40%', w: '80%', h: '20%',
    align: 'center', fontSize: 44, color: 'FFFFFF', bold: true,
  });

  // Parse and chunk lyrics
  const rawLines = lyricsText.split(/\r?\n/);
  let chunk = [];
  
  const createLyricsSlide = (lines) => {
    const slide = pptx.addSlide();
    slide.background = { color: '000000' };
    slide.addText(lines.join("\n"), {
      x: '5%', y: '5%', w: '90%', h: '90%',
      align: 'center', fontSize: 36, color: 'FFFFFF',
      valign: 'middle',
    });
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    
    // Break on empty lines (paragraph breaks)
    if (line === '') {
      if (chunk.length > 0) {
         createLyricsSlide(chunk);
         chunk = [];
      }
    } else {
      chunk.push(line);
      // Force break if a chunk gets too long (e.g. no empty lines provided)
      if (chunk.length >= 8) {
         createLyricsSlide(chunk);
         chunk = [];
      }
    }
  }
  
  if (chunk.length > 0) {
    createLyricsSlide(chunk);
  }

  // Generate buffer
  const buffer = await pptx.write('nodebuffer');
  
  // Send as downloadable file
  res.setHeader('Content-disposition', `attachment; filename="${encodeURIComponent(title)}.pptx"`);
  res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  res.end(buffer);
};

/**
 * Generates a PPTX from TXT lyrics where ONE STANZA = ONE SLIDE.
 * Supports Tamil, English, and Bilingual modes.
 * No title slide. Dynamic font sizing.
 */
export const generateTxtToPPT = async (title, lyricsTextTamil, lyricsTextEnglish, language, res) => {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  const normalize = (text) => (text || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const tamilStanzas = normalize(lyricsTextTamil).split(/\n{2,}/).map(s => s.trim()).filter(s => s !== '');
  const englishStanzas = normalize(lyricsTextEnglish).split(/\n{2,}/).map(s => s.trim()).filter(s => s !== '');

  const maxStanzas = Math.max(tamilStanzas.length, englishStanzas.length);

  for (let i = 0; i < maxStanzas; i++) {
    const tStanza = tamilStanzas[i] || '';
    const eStanza = englishStanzas[i] || '';

    let combinedLines = [];
    if (language === 'tamil' && tStanza) combinedLines = tStanza.split('\n');
    else if (language === 'english' && eStanza) combinedLines = eStanza.split('\n');
    else if (language === 'bilingual') {
      if (tStanza) combinedLines.push(...tStanza.split('\n'));
      if (tStanza && eStanza) combinedLines.push(''); // blank line between languages
      if (eStanza) combinedLines.push(...eStanza.split('\n'));
    }

    if (combinedLines.length === 0) continue;

    const slide = pptx.addSlide();
    slide.background = { color: '000000' };

    // Determine font size dynamically based on line count and max line length
    let fontSize = 40;
    const maxLineLength = Math.max(...combinedLines.map(l => l.length));
    
    if (combinedLines.length > 12 || maxLineLength > 60) {
      fontSize = 24;
    } else if (combinedLines.length > 8 || maxLineLength > 50) {
      fontSize = 28;
    } else if (combinedLines.length > 6 || maxLineLength > 40) {
      fontSize = 32;
    } else if (combinedLines.length > 4 || maxLineLength > 30) {
      fontSize = 36;
    }

    slide.addText(combinedLines.join("\n"), {
      x: '5%', y: '5%', w: '90%', h: '90%',
      align: 'center', 
      valign: 'middle',
      fontSize: fontSize, 
      color: 'FFFFFF',
      fontFace: 'Nirmala UI', // Unicode Tamil font broadly available on Windows
      margin: 10
    });
  }

  // Generate buffer
  const buffer = await pptx.write('nodebuffer');
  
  // Clean up filename (remove invalid chars)
  const safeFilename = title.replace(/[<>:"/\\|?*]/g, "").replace(/\s+/g, " ").trim() || "song";
  
  // Send as downloadable file
  res.setHeader('Content-disposition', `attachment; filename="${encodeURIComponent(safeFilename)}.pptx"`);
  res.setHeader('Content-type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
  res.end(buffer);
};
