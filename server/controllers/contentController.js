import ContentBlock from "../models/ContentBlock.js";
import { getCached, setCached, clearCache, isCacheStale } from "../utils/cache.js";

const refreshBlock = async (key) => {
  try {
    const block = await ContentBlock.findOne({ key }).lean();
    const responseData = block || { key, data: {} };
    
    // Process auto-expiry for pastor messages on read
    if (key === "pastor-messages" || key === "pastor-messages-draft") {
      if (responseData.data && Array.isArray(responseData.data.messages)) {
        const now = new Date();
        const originalLen = responseData.data.messages.length;
        responseData.data.messages = responseData.data.messages.filter(msg => {
          if (msg.expiresAt && new Date(msg.expiresAt) <= now) return false;
          return true;
        });
        
        // If anything was expired, update DB in background
        if (responseData.data.messages.length !== originalLen) {
           ContentBlock.updateOne({ key }, { $set: { data: responseData.data } })
             .catch(e => console.error("Auto-cleanup update failed:", e));
        }
      }
    }

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

    // Process auto-expiry for pastor messages on save
    if (key === "pastor-messages" || key === "pastor-messages-draft") {
      if (data && Array.isArray(data.messages)) {
        const now = new Date();
        
        data.messages = data.messages.map(msg => {
          if (!msg.createdAt) msg.createdAt = new Date();
          
          if (msg.durationDays === undefined) {
            msg.durationDays = 7;
          }
          
          if (msg.durationDays) {
             msg.expiresAt = new Date(new Date(msg.createdAt).getTime() + msg.durationDays * 24 * 60 * 60 * 1000);
          } else {
             delete msg.expiresAt;
          }
          return msg;
        });
        
        // Filter out already expired ones
        data.messages = data.messages.filter(msg => {
          if (msg.expiresAt && new Date(msg.expiresAt) <= now) return false;
          return true;
        });
      }
    }

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