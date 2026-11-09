import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";

try {
  if (ffmpegInstaller && ffmpegInstaller.path) {
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);
  }
} catch (e) {
  console.warn("⚠️ Could not set ffmpeg path:", e.message);
}

export const compressImage = async (inputPath) => {
  try {
    if (!inputPath || !fs.existsSync(inputPath)) {
      return { filePath: inputPath, originalSize: 0, compressedSize: 0, isCompressed: false };
    }

    const originalSize = fs.statSync(inputPath).size;

    if (originalSize < 100 * 1024) { // Don't compress if < 100KB
      return { filePath: inputPath, originalSize, compressedSize: originalSize, isCompressed: false };
    }

    const tempOutput = path.join(os.tmpdir(), `img-out-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`);
    
    // High-quality WebP, preserve metadata, max 1920x1920
    await sharp(inputPath)
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .toFormat("webp", { quality: 80 })
      .withMetadata()
      .toFile(tempOutput);

    const compressedSize = fs.statSync(tempOutput).size;

    // If compression didn't save at least 10%, keep original
    if (compressedSize > originalSize * 0.9) {
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
      return { filePath: inputPath, originalSize, compressedSize: originalSize, isCompressed: false };
    }

    return { filePath: tempOutput, originalSize, compressedSize, isCompressed: true };
  } catch (error) {
    console.error("Image Compression Error (using original):", error.message);
    const fallbackSize = (inputPath && fs.existsSync(inputPath)) ? fs.statSync(inputPath).size : 0;
    return { filePath: inputPath, originalSize: fallbackSize, compressedSize: fallbackSize, isCompressed: false };
  }
};

export const compressVideo = (inputPath) => {
  return new Promise((resolve) => {
    try {
      if (!inputPath || !fs.existsSync(inputPath)) {
        return resolve({ filePath: inputPath, originalSize: 0, compressedSize: 0, isCompressed: false });
      }

      const originalSize = fs.statSync(inputPath).size;
      const tempOutput = path.join(os.tmpdir(), `vid-out-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`);

      if (originalSize < 1024 * 1024) { // Don't compress if < 1MB
        return resolve({ filePath: inputPath, originalSize, compressedSize: originalSize, isCompressed: false });
      }

      // Sensible CRF for quality, no extreme degradation
      const crf = 24; 

      const timeoutId = setTimeout(() => {
        console.error("[UPLOAD TRACE] X. FFmpeg timed out after 5 minutes!");
        try {
          if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        } catch { /* ignore */ }
        resolve({ filePath: inputPath, originalSize, compressedSize: originalSize, isCompressed: false });
      }, 5 * 60 * 1000);

      ffmpeg(inputPath)
        .outputOptions([
          "-vcodec libx264",
          `-crf ${crf}`,
          "-preset fast",
          "-acodec aac",
          "-b:a 128k",
          "-movflags +faststart",
          "-vf scale='min(1920,iw)':-2"
        ])
        .toFormat("mp4")
        .on("end", () => {
          clearTimeout(timeoutId);
          try {
            const compressedSize = fs.statSync(tempOutput).size;

            if (compressedSize > originalSize * 0.9) {
              if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
              return resolve({ filePath: inputPath, originalSize, compressedSize: originalSize, isCompressed: false });
            }

            resolve({ filePath: tempOutput, originalSize, compressedSize, isCompressed: true });
          } catch (error) {
            console.error("Video compression output read error:", error);
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
            resolve({ filePath: inputPath, originalSize, compressedSize: originalSize, isCompressed: false });
          }
        })
        .on("error", (error) => {
          clearTimeout(timeoutId);
          console.error("FFmpeg Compression Error:", error);
          try {
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
          } catch { /* ignore */ }
          resolve({ filePath: inputPath, originalSize, compressedSize: originalSize, isCompressed: false });
        })
        .save(tempOutput);
    } catch (error) {
      console.error("Video Temp File Error:", error);
      resolve({ filePath: inputPath, originalSize: 0, compressedSize: 0, isCompressed: false });
    }
  });
};

export const compressPdf = async (inputPath) => {
  try {
    if (!inputPath || !fs.existsSync(inputPath)) {
      return { filePath: inputPath, originalSize: 0, compressedSize: 0, isCompressed: false };
    }

    const originalSize = fs.statSync(inputPath).size;

    if (originalSize < 100 * 1024) { // Don't compress if < 100KB
      return { filePath: inputPath, originalSize, compressedSize: originalSize, isCompressed: false };
    }

    const { PDFDocument } = await import("pdf-lib");
    const pdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    
    // Save the PDF. This strips out unused objects and optimizes structure.
    const optimizedPdfBytes = await pdfDoc.save({ useObjectStreams: true });
    
    const tempOutput = path.join(os.tmpdir(), `pdf-out-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`);
    fs.writeFileSync(tempOutput, optimizedPdfBytes);

    const compressedSize = fs.statSync(tempOutput).size;

    // If compression didn't save at least 5%, keep original
    if (compressedSize > originalSize * 0.95) {
      if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
      return { filePath: inputPath, originalSize, compressedSize: originalSize, isCompressed: false };
    }

    return { filePath: tempOutput, originalSize, compressedSize, isCompressed: true };
  } catch (error) {
    console.error("PDF Compression Error:", error);
    const fallbackSize = (inputPath && fs.existsSync(inputPath)) ? fs.statSync(inputPath).size : 0;
    return { filePath: inputPath, originalSize: fallbackSize, compressedSize: fallbackSize, isCompressed: false };
  }
};
