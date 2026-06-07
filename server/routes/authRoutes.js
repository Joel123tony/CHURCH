import express from "express";
import User from "../models/User.js";
import { login, me, register } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles, adminOnly } from "../middleware/role.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const totalUsers = await User.countDocuments();

  if (totalUsers === 0) {
    return register(req, res);
  }

  return authMiddleware(req, res, () =>
    allowRoles("developer")(req, res, () => register(req, res))
  );
});
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.get("/admin", authMiddleware, adminOnly, me);

export default router;
