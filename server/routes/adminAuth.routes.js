import express from "express";
import auth from "../middleware/auth.js";

const router = express.Router();

/* =========================
   ADMIN DASHBOARD
========================= */
router.get("/dashboard", auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user,
      counts: {
        pastors: 10,
        sermons: 5,
        users: 20,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Server error",
    });
  }
});

export default router;