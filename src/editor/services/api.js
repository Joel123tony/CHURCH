import API from "../../api/axios";

/**
 * GET content block from backend
 */
export const getBlock = async (key) => {
  const res = await API.get(`/content/${key}`);
  return res.data;
};

/**
 * SAVE content block to backend
 */
export const saveBlock = async (key, data) => {
  const res = await API.post(`/content/save`, {
    key,
    data,
  });
  return res.data;
};