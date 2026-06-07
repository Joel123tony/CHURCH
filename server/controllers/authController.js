import User from "../models/User.js";
import { createToken } from "../utils/jwt.js";

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const sendAuthResponse = (res, user, statusCode = 200) => {
  const token = createToken(user);

  res.cookie("token", token, cookieOptions());

  return res.status(statusCode).json({
    message: statusCode === 201 ? "Registration successful" : "Login successful",
    token,
    user: sanitizeUser(user),
  });
};

const canBootstrap = async () => {
  const count = await User.countDocuments();
  return count === 0;
};

export const register = async (req, res) => {
  try {
    const { name = "", email = "", password = "" } = req.body;
    const role = req.body.role;

    if (!email.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const isBootstrap = await canBootstrap();
    if (!isBootstrap && (!req.user || req.user.role !== "developer")) {
      return res.status(403).json({ error: "Developer access required" });
    }

    const allowedRole = ["developer", "pastor"].includes(role) ? role : "pastor";

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: isBootstrap ? "developer" : allowedRole,
    });

    return sendAuthResponse(res, user, 201);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email = "", password = "" } = req.body;

    if (!email.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    return sendAuthResponse(res, user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
