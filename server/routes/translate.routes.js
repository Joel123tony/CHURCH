import express from "express";
import { translate } from "../controllers/translateController.js";

const router = express.Router();

router.post("/", translate);

export default router;
