import express from "express";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/dashboard", auth, async (req, res) => {
  try {
    res.json({
      user: req.user,
      counts: {
        pastors: 10,
        sermons: 5,
        users: 20,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;