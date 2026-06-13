import Gallery from "../models/Gallery.js";
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

    const result = await uploadToCloudinary(
      req.file.buffer
    );

    const media = await Gallery.create({
      title: req.body.title || "Untitled",
      eventDate: req.body.eventDate || null,
      mediaType:
        result.resource_type === "video"
          ? "video"
          : "image",
      url: result.url,
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