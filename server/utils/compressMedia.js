import sharp from "sharp";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export const compressImage = async (buffer) => {
  const originalSize = buffer.length;
  const sizeMB = originalSize / (1024 * 1024);

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
      .withMetadata(false)
      .toBuffer();

    const compressedSize = compressedBuffer.length;
    if (compressedSize > originalSize * 0.9) {
      return { buffer, originalSize, compressedSize: originalSize, isCompressed: false };
    }

    return { buffer: compressedBuffer, originalSize, compressedSize, isCompressed: true };
  } catch (error) {
    console.error("Image Compression Error:", error);
    return { buffer, originalSize, compressedSize: originalSize, isCompressed: false };
  }
};

export const compressVideo = (buffer) => {
  return new Promise((resolve) => {
    const originalSize = buffer.length;
    const tempInput = path.join(os.tmpdir(), `input-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`);
    const tempOutput = path.join(os.tmpdir(), `output-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`);

    if (originalSize < 1024 * 1024) {
      return resolve({ buffer, originalSize, compressedSize: originalSize, isCompressed: false });
    }

    try {
      fs.writeFileSync(tempInput, buffer);

      let crf = 24;
      const sizeMB = originalSize / (1024 * 1024);
      if (sizeMB > 1000) crf = 32;
      else if (sizeMB > 500) crf = 30;
      else if (sizeMB > 100) crf = 28;

      const timeoutId = setTimeout(() => {
        console.error("[UPLOAD TRACE] X. FFmpeg timed out after 5 minutes!");
        try {
          if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
          if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        } catch {
          // Ignore cleanup failures.
        }
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
          "-vf scale='min(1920,iw)':-2"
        ])
        .toFormat("mp4")
        .on("end", () => {
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
          } catch (error) {
            console.error("Video compression readback error:", error);
            resolve({ buffer, originalSize, compressedSize: originalSize, isCompressed: false });
          }
        })
        .on("error", (error) => {
          clearTimeout(timeoutId);
          console.error("[UPLOAD TRACE] X. FFmpeg Compression Error:", error);
          try {
            if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
            if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
          } catch {
            // Ignore cleanup failures.
          }
          resolve({ buffer, originalSize, compressedSize: originalSize, isCompressed: false });
        })
        .save(tempOutput);
    } catch (error) {
      console.error("Video Temp File Error:", error);
      resolve({ buffer, originalSize, compressedSize: originalSize, isCompressed: false });
    }
  });
};
