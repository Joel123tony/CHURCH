import express from "express";
import { 
  createSongRequest, 
  getSongRequests, 
  updateRequestStatus, 
  deleteSongRequest 
} from "../controllers/songRequestController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Public: Submit a request
router.post("/", createSongRequest);

// Protected Admin routes
router.get("/", auth, getSongRequests);
router.put("/:id", auth, updateRequestStatus);
router.delete("/:id", auth, deleteSongRequest);

export default router;
