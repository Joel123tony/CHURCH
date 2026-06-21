import PrayerRequest from "../models/PrayerRequest.js";

/* CREATE */
export const createPrayerRequest = async (
  req,
  res
) => {
  try {
    console.log(
      "PRAYER REQUEST RECEIVED:",
      req.body
    );

    const prayer = await PrayerRequest.create(
      req.body
    );

    res.status(201).json({
      success: true,
      data: prayer,
    });
  } catch (err) {
    console.error(
      "CREATE PRAYER ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* GET ALL */
export const getPrayerRequests = async (
  req,
  res
) => {
  try {
    const prayers =
      await PrayerRequest.find().sort({
        createdAt: -1,
      });

    res.json({
      success: true,
      data: prayers,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* MARK AS PRAYED */
export const markAsPrayed = async (
  req,
  res
) => {
  try {
    const prayer =
      await PrayerRequest.findByIdAndUpdate(
        req.params.id,
        {
          status: "prayed",
        },
        {
          new: true,
        }
      );

    res.json({
      success: true,
      data: prayer,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* DELETE MANY */
export const deletePrayerRequests = async (
  req,
  res
) => {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.filter(Boolean)
      : [];

    if (!ids.length) {
      return res.status(400).json({
        success: false,
        message:
          "No prayer request ids provided",
      });
    }

    const result =
      await PrayerRequest.deleteMany({
        _id: { $in: ids },
      });

    res.json({
      success: true,
      deletedCount:
        result.deletedCount || 0,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* COUNTS */
export const getPrayerCounts = async (
  req,
  res
) => {
  try {
    const pending =
      await PrayerRequest.countDocuments({
        status: "pending",
      });

    const completed =
      await PrayerRequest.countDocuments({
        status: "prayed",
      });

    res.json({
      success: true,
      pending,
      completed,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};