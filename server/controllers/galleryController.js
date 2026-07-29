import Gallery from "../models/Gallery.js";
import { isValidObjectId } from "mongoose";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js";
import { getCached, setCached, clearCache } from "../utils/cache.js";

const CACHE_KEY = "gallery_client";

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
    

    // Note: uploadToCloudinary handles both local compression and Cloudinary upload
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: isVideo ? "mtc-padikuppam/gallery/videos" : "mtc-padikuppam/gallery/images",
      resource_type: isVideo ? "video" : "image",
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
      thumbnail: result.resource_type === "video" ? result.url.replace(/\.[^/.]+$/, ".jpg") : null,
      folder: result.folder || null,
      size: result.bytes || null,
      duration: result.duration || null,
      dimensions: result.width && result.height ? { width: result.width, height: result.height } : null,
    });


    clearCache(CACHE_KEY);

    return res.status(201).json({
      success: true,
      data: media,
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      savings: result.savings,
      savingsPercentage: result.savingsPercentage,
      status: result.status
    });
  } catch (err) {


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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const media = await Gallery.find()
      .select('_id title eventDate mediaType url thumbnail public_id clientPriority folder size duration dimensions createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Gallery.countDocuments();

    return res.json({
      success: true,
      data: media,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page
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
    const cachedData = getCached(CACHE_KEY);
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const media = await Gallery.find({
      clientPriority: {
        $ne: null,
      },
    })
      .select("url thumbnail title mediaType category eventDate createdAt clientPriority")
      .sort({
        clientPriority: 1,
      })
      .limit(4)
      .lean();

    setCached(CACHE_KEY, media, 60);

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
          returnDocument: 'after',
        }
      );

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    clearCache(CACHE_KEY);

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

    clearCache(CACHE_KEY);

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

    clearCache(CACHE_KEY);

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
        clearCache(CACHE_KEY);

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
      clearCache(CACHE_KEY);

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
