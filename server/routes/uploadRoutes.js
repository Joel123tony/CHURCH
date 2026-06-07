import express from "express";
import upload from "../middleware/upload.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { authMiddleware } from "../middleware/auth.js";
import { allowRoles } from "../middleware/role.js";

const router = express.Router();

router.post(
  "/image",
  authMiddleware,
  allowRoles("developer", "pastor"),
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const result = await uploadToCloudinary(req.file.buffer);

      res.json({
        success: true,
        url: result.url,
        public_id: result.public_id,
      });
    } catch (err) {
      console.error("UPLOAD ERROR:", err);

      res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  }
);

export default router;
