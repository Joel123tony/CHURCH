export const scoreLyricsConfidence = ({ lyrics = "", metadata = {}, validation = {}, providerConfidence = 0, merged = false }) => {
  let score = validation?.score || Number(providerConfidence) || 55;

  if (merged) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const confidenceBand = score >= 95 ? "Complete" : score >= 85 ? "Minor cleanup" : score >= 60 ? "Needs review" : "Incomplete";

  return {
    score,
    confidenceBand,
    needsReview: score < 80
  };
};
