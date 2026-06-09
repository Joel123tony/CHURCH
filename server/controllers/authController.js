import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // simple password check (you can add bcrypt later)
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // create JWT token
    const token = jwt.sign(
      { id: user._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};