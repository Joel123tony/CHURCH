import ContentBlock from "../models/ContentBlock.js";
import { clearCache } from "./cache.js";

export const cleanupExpiredAnnouncements = async () => {
  try {
    const keys = ["pastor-messages", "pastor-messages-draft"];
    const now = new Date();

    for (const key of keys) {
      const block = await ContentBlock.findOne({ key });
      if (!block || !block.data || !Array.isArray(block.data.messages)) continue;

      const originalLen = block.data.messages.length;
      block.data.messages = block.data.messages.filter(msg => {
        if (msg.expiresAt && new Date(msg.expiresAt) <= now) return false;
        return true;
      });

      if (block.data.messages.length !== originalLen) {
        await ContentBlock.updateOne({ key }, { $set: { data: block.data } });
        clearCache(`content_${key}`);
        console.log(`[Cron] Purged ${originalLen - block.data.messages.length} expired announcements from ${key}`);
      }
    }
  } catch (err) {
    console.error("[Cron] Error cleaning announcements:", err);
  }
};
