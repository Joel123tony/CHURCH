import { processLyricsWithAi } from "./ai/index.js";

export const cleanLyricsWithAI = async (rawText, context = {}) => {
  return processLyricsWithAi(rawText, context);
};

export default cleanLyricsWithAI;
