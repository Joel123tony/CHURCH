import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { createToken } from "../utils/jwt.js";

const router = express.Router();

//
// 🔐 REGISTER (TEMP - REMOVE LATER IN PRODUCTION)
//
router.post("/register", async (req, res) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);

    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: hashed,
      role: req.body.role || "ADMIN",
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// 🔐 LOGIN
//
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const ok = await bcrypt.compare(req.body.password, user.password);

    if (!ok) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = createToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;