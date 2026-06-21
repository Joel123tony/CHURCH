import Gallery from "../models/Gallery.js";
import { isValidObjectId } from "mongoose";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";

/* =========================
   UPLOAD MEDIA
========================= */
export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required",
      });
    }

    const isVideo = req.file.mimetype?.startsWith("video/");
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: "church/gallery",
      resource_type: isVideo ? "video" : "image",
      ...(isVideo
        ? {
            eager: [
              {
                format: "mp4",
                quality: "auto",
                video_codec: "h264",
                bit_rate: "1200k",
              },
            ],
          }
        : {}),
    });

    const media = await Gallery.create({
      title: req.body.title || "Untitled",
      eventDate: req.body.eventDate || null,
      mediaType:
        result.resource_type === "video"
          ? "video"
          : "image",
      url: result.optimized_url || result.url,
      public_id: result.public_id,
      clientPriority: null,
    });

    return res.status(201).json({
      success: true,
      data: media,
    });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   ADMIN LIST
========================= */
export const getAllMedia = async (req, res) => {
  try {
    const media = await Gallery.find()
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: media,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   CLIENT GALLERY
========================= */
export const getClientMedia = async (
  req,
  res
) => {
  try {
    const media = await Gallery.find({
      clientPriority: {
        $ne: null,
      },
    })
      .sort({
        clientPriority: 1,
      })
      .limit(4);

    return res.json({
      success: true,
      data: media,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   UPDATE MEDIA
========================= */
export const updateMedia = async (
  req,
  res
) => {
  try {
    const media =
      await Gallery.findByIdAndUpdate(
        req.params.id,
        {
          title: req.body.title,
          eventDate:
            req.body.eventDate || null,
        },
        {
          new: true,
        }
      );

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    return res.json({
      success: true,
      data: media,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   DELETE MEDIA
========================= */
export const deleteMedia = async (
  req,
  res
) => {
  try {
    const media =
      await Gallery.findById(
        req.params.id
      );

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    await deleteFromCloudinary(
      media.public_id,
      media.mediaType
    );

    await media.deleteOne();

    return res.json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   BULK DELETE MEDIA
========================= */
export const bulkDeleteMedia = async (
  req,
  res
) => {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? [...new Set(req.body.ids.filter(Boolean))]
      : [];

    const validIds = ids.filter((id) =>
      isValidObjectId(id)
    );

    if (!validIds.length) {
      return res.status(400).json({
        success: false,
        message: "At least one valid media id is required",
      });
    }

    const mediaList = await Gallery.find({
      _id: { $in: validIds },
    });

    if (!mediaList.length) {
      return res.status(404).json({
        success: false,
        message: "No matching media found",
      });
    }

    await Promise.all(
      mediaList.map((media) =>
        deleteFromCloudinary(
          media.public_id,
          media.mediaType
        )
      )
    );

    await Gallery.deleteMany({
      _id: { $in: mediaList.map((item) => item._id) },
    });

    return res.json({
      success: true,
      message: "Selected media deleted successfully",
      data: {
        requestedCount: validIds.length,
        deletedCount: mediaList.length,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* =========================
   TOGGLE HOMEPAGE GALLERY
========================= */
export const toggleClientGallery =
  async (req, res) => {
    try {
      const media =
        await Gallery.findById(
          req.params.id
        );

      if (!media) {
        return res.status(404).json({
          success: false,
          message: "Media not found",
        });
      }

      /* REMOVE FROM GALLERY */
      if (
        media.clientPriority !== null
      ) {
        media.clientPriority = null;

        await media.save();

        return res.json({
          success: true,
          data: media,
        });
      }

      /* CURRENT ITEMS */
      const selected =
        await Gallery.find({
          clientPriority: {
            $ne: null,
          },
        });

      if (selected.length >= 4) {
        return res.status(400).json({
          success: false,
          message:
            "Only 4 media items can be shown on homepage",
        });
      }

      /* FIND AVAILABLE SLOT */
      const usedSlots = selected
        .map(
          (item) =>
            item.clientPriority
        )
        .filter(Boolean);

      let slot = 1;

      while (
        usedSlots.includes(slot)
      ) {
        slot++;
      }

      media.clientPriority = slot;

      await media.save();

      return res.json({
        success: true,
        data: media,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };
