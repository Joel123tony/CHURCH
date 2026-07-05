import ContentBlock from "../models/ContentBlock.js";

// GET CMS BLOCK
export const getBlock = async (req, res) => {
  const block = await ContentBlock.findOne({
    key: req.params.key
  });

  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");

  res.json(block || { key: req.params.key, data: {} });
};

// SAVE CMS BLOCK
export const saveBlock = async (req, res) => {
  const { key, data } = req.body;

  const updated = await ContentBlock.findOneAndUpdate(
    { key },
    { key, data, updatedAt: new Date() },
    { upsert: true, new: true }
  );

  res.json(updated);
};