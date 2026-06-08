import express from "express";
import Pastor from "../models/Pastor.js";
import Sermon from "../models/Sermon.js";

const router = express.Router();

/* DASHBOARD */
router.get("/dashboard", async (req, res) => {
  try {
    const [pastorsCount, sermonsCount, latestSermons] =
      await Promise.all([
        Pastor.countDocuments(),
        Sermon.countDocuments(),
        Sermon.find().sort({ createdAt: -1 }).limit(5),
      ]);

    res.json({
      counts: {
        pastors: pastorsCount,
        sermons: sermonsCount,
      },
      latestSermons,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* PASTORS */
router.get("/pastors", async (req, res) => {
  try {
    const pastors = await Pastor.find().sort({ createdAt: -1 });
    res.json(pastors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pastors", async (req, res) => {
  try {
    const pastor = await Pastor.create(req.body);
    res.status(201).json(pastor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/pastors/:id", async (req, res) => {
  try {
    const pastor = await Pastor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(pastor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/pastors/:id", async (req, res) => {
  try {
    await Pastor.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Pastor deleted",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* SERMONS */
router.get("/sermons", async (req, res) => {
  try {
    const sermons = await Sermon.find().sort({ createdAt: -1 });
    res.json(sermons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/sermons", async (req, res) => {
  try {
    const sermon = await Sermon.create(req.body);
    res.status(201).json(sermon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/sermons/:id", async (req, res) => {
  try {
    await Sermon.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Sermon deleted",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;