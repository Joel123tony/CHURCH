import ContentBlock from "../models/ContentBlock.js";
import { getCached, setCached, clearCache, isCacheStale } from "../utils/cache.js";

const refreshBlock = async (key) => {
  try {
    const block = await ContentBlock.findOne({ key }).lean();
    const responseData = block || { key, data: {} };
    setCached(`content_${key}`, responseData, 60);
    return responseData;
  } catch (err) {
    console.error("refreshBlock ERROR:", err);
    return { key, data: {} };
  }
};

// GET CMS BLOCK
export const getBlock = async (req, res) => {
  try {
    const cacheKey = `content_${req.params.key}`;
    const cachedData = getCached(cacheKey, true);
    if (cachedData) {
      if (isCacheStale(cacheKey)) {
        refreshBlock(req.params.key).catch(err => console.error("Background block refresh failed:", err));
      }
      return res.json(cachedData);
    }

    const responseData = await refreshBlock(req.params.key);
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