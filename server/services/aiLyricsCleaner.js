import { processLyricsWithAi } from "./ai/index.js";

export const cleanLyricsWithAI = async (rawText, context = {}) => {
  const result = await processLyricsWithAi(rawText, context);
  if (result && result.lyrics) {
      // Strip any residual HTML tags the AI might have returned
      result.lyrics = result.lyrics.replace(/<[^>]+>/g, '').trim();
      if (result.cleanedLyrics) {
          result.cleanedLyrics = result.cleanedLyrics.replace(/<[^>]+>/g, '').trim();
      }
  }
  return result;
};

export default cleanLyricsWithAI;
