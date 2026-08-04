import express from "express";
import { getHomePageData } from "../controllers/homeController.js";

const router = express.Router();

router.get("/", getHomePageData);

export default router;
