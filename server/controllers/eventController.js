import Event from "../models/Event.js";
import { getCached, setCached, clearCache } from "../utils/cache.js";

const CACHE_KEY = "events_all";

/* CREATE */
export const createEvent = async (req, res) => {
  try {
    const event = await Event.create(req.body);
    clearCache(CACHE_KEY);

    return res.status(201).json({
      success: true,
      data: event,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* GET ALL (sorted by date ASC) */
export const getEvents = async (req, res) => {
  try {
    const cachedData = getCached(CACHE_KEY);
    if (cachedData) {
      return res.json({ success: true, data: cachedData });
    }

    const events = await Event.find().sort({ date: 1 }).lean();
    setCached(CACHE_KEY, events, 60);

    res.json({
      success: true,
      data: events,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* UPDATE */
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', lean: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    clearCache(CACHE_KEY);

    res.json({
      success: true,
      data: event,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* DELETE */
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    clearCache(CACHE_KEY);

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};