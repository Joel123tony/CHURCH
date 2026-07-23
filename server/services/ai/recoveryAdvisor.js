export const buildRecoveryAdvice = ({ score = 0, validation = {}, providerHistory = [] } = {}) => {
  const advice = [];

  if (score < 80) {
    advice.push("retry provider");
    advice.push("try another provider");
    advice.push("merge providers");
    advice.push("rerun AI cleanup");
  }

  if ((validation?.issues || []).includes("missing chorus")) advice.push("check alternate provider for chorus");
  if ((validation?.issues || []).includes("likely truncated")) advice.push("pull a longer source version");
  if ((validation?.issues || []).includes("contains page clutter")) advice.push("strip page boilerplate before retry");
  if ((providerHistory || []).length > 0) advice.push("preserve provider history");

  return Array.from(new Set(advice));
};
