import PrayerRequest from "../models/PrayerRequest.js";

/* CREATE */
export const createPrayerRequest = async (
  req,
  res
) => {
  try {
    const prayer = await PrayerRequest.create(
      req.body
    );

    res.status(201).json({
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