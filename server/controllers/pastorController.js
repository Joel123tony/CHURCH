import Pastor from "../models/Pastor.js";

/* =========================
   CREATE PASTOR
========================= */
export const createPastor = async (req, res) => {
  try {
    console.log("CREATE PASTOR BODY:", req.body);

    const pastor = await Pastor.create({
      name: req.body.name,
      role: req.body.role || "Pastor",
      bio: req.body.bio || "",
      image: req.body.image || "",
      joinedYear: req.body.joinedYear || "",
      leftYear: req.body.leftYear || "",
      number: req.body.number || "",
      active: req.body.active ?? true,
    });

    res.status(201).json({
      success: true,
      pastor,
    });
  } catch (err) {
    console.log("CREATE ERROR:", err.message);
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

    res.json({
      success: true,
      pastors,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      pastors: [],
    });
  }
};

/* =========================
   GET PUBLIC PASTORS
========================= */
export const getPublicPastors = async (req, res) => {
  try {
    const pastors = await Pastor.find({ active: true }).sort({
      joinedYear: -1,
    });

    res.json({
      success: true,
      pastors,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      pastors: [],
    });
  }
};

/* =========================
   SEARCH
========================= */
export const searchPastors = async (req, res) => {
  try {
    const { name = "", year = "" } = req.query;

    const query = { active: true };

    if (name.trim()) {
      query.name = { $regex: name.trim(), $options: "i" };
    }

    if (year.trim()) {
      const y = Number(year);
      query.$or = [{ joinedYear: y }, { leftYear: y }];
    }

    const pastors = await Pastor.find(query);

    res.json({
      success: true,
      pastors,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      pastors: [],
    });
  }
};

/* =========================
   UPDATE
========================= */
export const updatePastor = async (req, res) => {
  try {
    const pastor = await Pastor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
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
   DELETE
========================= */
export const deletePastor = async (req, res) => {
  try {
    await Pastor.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Pastor deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};