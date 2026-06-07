import express from "express";
import Pastor from "../models/Pastor.js";
import Sermon from "../models/Sermon.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";

const router = express.Router();

const adminAccess = [authMiddleware, allowRoles("developer", "pastor")];
const developerOnly = [authMiddleware, allowRoles("developer")];

router.get("/dashboard", ...adminAccess, async (req, res) => {
  try {
    const [pastorsCount, sermonsCount, usersCount, latestSermons] =
      await Promise.all([
        Pastor.countDocuments(),
        Sermon.countDocuments(),
        User.countDocuments(),
        Sermon.find().sort({ createdAt: -1 }).limit(5),
      ]);

    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role,
      },
      message: `Welcome ${req.user.role === "developer" ? "Developer" : "Pastor"} ${req.user.name}`,
      counts: {
        pastors: pastorsCount,
        sermons: sermonsCount,
        users: usersCount,
      },
      latestSermons,
      permissions:
        req.user.role === "developer"
          ? ["dashboard", "pastors", "sermons", "settings", "users", "homepage"]
          : ["dashboard", "sermons", "church-data"],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/sermons", ...adminAccess, async (req, res) => {
  try {
    const sermons = await Sermon.find().sort({ date: -1, createdAt: -1 });
    res.json(sermons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/sermons", ...adminAccess, async (req, res) => {
  try {
    const sermon = await Sermon.create({
      title: req.body.title,
      preacher: req.body.preacher || req.user.name,
      scripture: req.body.scripture || "",
      date: req.body.date || Date.now(),
      summary: req.body.summary || "",
      content: req.body.content || "",
      mediaUrl: req.body.mediaUrl || "",
      published: req.body.published !== false,
      createdBy: req.user.id,
    });

    res.status(201).json(sermon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/sermons/:id", ...adminAccess, async (req, res) => {
  try {
    const sermon = await Sermon.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        preacher: req.body.preacher,
        scripture: req.body.scripture,
        date: req.body.date,
        summary: req.body.summary,
        content: req.body.content,
        mediaUrl: req.body.mediaUrl,
        published: req.body.published,
      },
      { new: true, runValidators: true }
    );

    res.json(sermon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/sermons/:id", ...developerOnly, async (req, res) => {
  try {
    await Sermon.findByIdAndDelete(req.params.id);
    res.json({ message: "Sermon deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/settings", ...developerOnly, async (req, res) => {
  res.json({
    message: "Settings updated",
    settings: req.body || {},
  });
});

router.put("/homepage", ...developerOnly, async (req, res) => {
  res.json({
    message: "Homepage sections updated",
    homepage: req.body || {},
  });
});

router.get("/users", ...developerOnly, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/users/:id", ...developerOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
