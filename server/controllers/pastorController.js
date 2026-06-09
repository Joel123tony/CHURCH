import Pastor from "../models/Pastor.js";

/* =========================
   CREATE PASTOR
========================= */
export const createPastor = async (req, res) => {
  try {
    const pastor = await Pastor.create(req.body);

    res.status(201).json({
      success: true,
      pastor,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

/* =========================
   GET ALL PASTORS
========================= */
export const getAllPastors = async (req, res) => {
  try {
    const pastors = await Pastor.find().sort({ createdAt: -1 });

    res.json({ success: true, pastors });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      pastors: [],
    });
  }
};

/* =========================
   PUBLIC PASTORS
========================= */
export const getPublicPastors = async (req, res) => {
  try {
    const pastors = await Pastor.find({ active: true }).sort({
      joinedYear: -1,
    });

    res.json({ success: true, pastors });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      pastors: [],
    });
  }
};

/* =========================
   SEARCH PASTORS
========================= */
export const searchPastors = async (req, res) => {
  try {
    const { name = "", year = "" } = req.query;

    const query = {};

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    if (year) {
      query.$or = [{ joinedYear: Number(year) }, { leftYear: Number(year) }];
    }

    const pastors = await Pastor.find(query);

    res.json({ success: true, pastors });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      pastors: [],
    });
  }
};

/* =========================
   UPDATE PASTOR
========================= */
export const updatePastor = async (req, res) => {
  try {
    const pastor = await Pastor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({ success: true, pastor });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

/* =========================
   DELETE PASTOR
========================= */
export const deletePastor = async (req, res) => {
  try {
    await Pastor.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Pastor deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};