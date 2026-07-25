import ContentBlock from "../models/ContentBlock.js";
import { getCached, setCached, clearCache } from "../utils/cache.js";

// GET CMS BLOCK
export const getBlock = async (req, res) => {
  try {
    const cacheKey = `content_${req.params.key}`;
    const cachedData = getCached(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const block = await ContentBlock.findOne({
      key: req.params.key
    }).lean();

    const responseData = block || { key: req.params.key, data: {} };
    setCached(cacheKey, responseData, 60);

    return res.json(responseData);
  } catch (err) {
    console.error("getBlock ERROR:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// SAVE CMS BLOCK
export const saveBlock = async (req, res) => {
  try {
    const { key, data } = req.body;

    const updated = await ContentBlock.findOneAndUpdate(
      { key },
      { key, data, updatedAt: new Date() },
      { upsert: true, returnDocument: 'after', lean: true }
    );

    clearCache(`content_${key}`);

    res.json(updated);
  } catch (err) {
    console.error("saveBlock ERROR:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};