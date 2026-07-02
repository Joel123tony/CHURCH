import express from "express";
import { getBlock, saveBlock } from "../controllers/contentController.js";

const router = express.Router();

router.get("/:key", getBlock);
router.post("/save", saveBlock);

export default router;