import express from "express";
import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";

const router = express.Router();

/* =========================
   EVENTS ROUTES
========================= */

/* CREATE EVENT */
router.post("/", createEvent);

/* GET ALL EVENTS */
router.get("/", getEvents);

/* UPDATE EVENT */
router.put("/:id", updateEvent);

/* DELETE EVENT */
router.delete("/:id", deleteEvent);

export default router;