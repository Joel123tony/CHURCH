import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Smart compress an image buffer using Sharp.
 */
export const compressImage = async (buffer) => {
  const originalSize = buffer.length;
  const sizeMB = originalSize / (1024 * 1024);

  // Skip if very small (e.g., < 100KB)
  if (originalSize < 100 * 1024) {
    return { buffer, originalSize, compressedSize: originalSize, isCompressed: false };
  }

  try {
    let quality = 80;
    if (sizeMB > 10) quality = 40;
    else if (sizeMB > 5) quality = 50;
    else if (sizeMB > 2) quality = 60;
    else if (sizeMB > 0.5) quality = 70;

    const compressedBuffer = await sharp(buffer)
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .toFormat("webp", { quality })
      .withMetadata(false) // Strip EXIF
      .toBuffer();

    const compressedSize = compressedBuffer.length;
    // If savings are < 10%, keep original
    if (compressedSize > originalSize * 0.9) {
      return { buffer, originalSize, compressedSize: originalSize, isCompressed: false };
    }

    return { buffer: compressedBuffer, originalSize, compressedSize, isCompressed: true };
  } catch (err) {
    console.error("Image Compression Error:", err);
    return { buffer, originalSize, compressedSize: originalSize, isCompressed: false };
  }
};

/**
 * Smart compress a video buffer using FFmpeg.
 */
export const compressVideo = (buffer) => {
  return new Promise((resolve) => {
    const originalSize = buffer.length;
    const tempInput = path.join(os.tmpdir(), `input-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`);
    const tempOutput = path.join(os.tmpdir(), `output-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`);

    // Skip if very small < 1MB
    if (originalSize < 1024 * 1024) {

      return resolve({ buffer, originalSize, compressedSize: originalSize, isCompressed: false });
    }

    try {

      fs.writeFileSync(tempInput, buffer);

      let crf = 28;
      const sizeMB = originalSize / (1024 * 1024);
      if (sizeMB > 1000) crf = 32;
      else if (sizeMB > 500) crf = 30;
      else if (sizeMB > 100) crf = 28;
      else crf = 24;


      
      // Add a safety timeout (e.g., 5 minutes max for compression)
      const timeoutId = setTimeout(() => {
        console.error("[UPLOAD TRACE] X. FFmpeg timed out after 5 minutes!");
        try {
          if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
          if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        } catch(e){}
        resolve({ buffer, originalSize, compressedSize: originalSize, isCompressed: false });
      }, 5 * 60 * 1000);

      ffmpeg(tempInput)
        .outputOptions([
          "-vcodec libx264",
          `-crf ${crf}`,
          "-preset fast",
          "-acodec aac",
          "-b:a 128k",
          "-movflags +faststart",
          "-vf scale='min(1920,iw)':-2" // Max 1080p
        ])
        .toFormat('mp4')
        .on('end', () => {
          clearTimeout(timeoutId);

          try {
            const compressedBuffer = fs.readFileSync(tempOutput);
            const compressedSize = compressedBuffer.length;
            
            fs.unlinkSync(tempInput);
            fs.unlinkSync(tempOutput);

            if (compressedSize > originalSize * 0.9) {

              return resolve({ buffer, originalSize, compressedSize: originalSize, isCompressed: false });
            }


            resolve({ buffer: compressedBuffer, originalSize, compressedSize, isCompressed: true });
          } catch(err) {

            resolve({ buffer, originalSize, compressedSize: originalSize, isCompressed: false });
          }
        })
        .on('error', (err) => {
          clearTimeout(timeoutId);
          console.error("[UPLOAD TRACE] X. FFmpeg Compression Error:", err);
          try {
            if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
          } catch(e){}
          resolve({ buffer, originalSize, compressedSize: originalSize, isCompressed: false });
        })
        .save(tempOutput);
    } catch (err) {
      console.error("Video Temp File Error:", err);
      resolve({ buffer, originalSize, compressedSize: originalSize, isCompressed: false });
    }
  });
};
