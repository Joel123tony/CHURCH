import type { Request, Response } from "express";
import { Readable } from "node:stream";
import { MediaAsset } from "../models/MediaAsset";
import { cloudinary } from "../services/cloudinary";
import { touchContentVersion } from "../services/contentVersion";

export async function listMedia(_req: Request, res: Response) {
  const items = await MediaAsset.find().sort({ createdAt: -1 }).lean();
  res.json(items);
}

export async function createMedia(req: Request, res: Response) {
  const item = await MediaAsset.create(req.body);
  await touchContentVersion();
  res.status(201).json(item);
}

export async function uploadMedia(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: "File required" });
  }

  const result = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "church-platform",
        resource_type: req.file.mimetype.startsWith("video/") ? "video" : "image"
      },
      (error, uploaded) => {
        if (error || !uploaded) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(uploaded);
      }
    );

    Readable.from(req.file.buffer).pipe(stream);
  });

  const uploaded = result as {
    secure_url: string;
    public_id: string;
    thumbnail_url?: string;
    width?: number;
    height?: number;
  };

  const asset = await MediaAsset.create({
    type: req.file.mimetype.startsWith("video/") ? "video" : "image",
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    thumbUrl: uploaded.thumbnail_url ?? uploaded.secure_url,
    width: uploaded.width,
    height: uploaded.height
  });

  await touchContentVersion();
  res.status(201).json({ asset, uploaded });
}

export async function deleteMedia(req: Request, res: Response) {
  const item = await MediaAsset.findByIdAndDelete(req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Media not found" });
  }
  await touchContentVersion();
  res.status(204).send();
}
