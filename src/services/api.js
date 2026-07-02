import API from "../api/axios";

// ✅ NAMED EXPORTS (REQUIRED)
export const getBlock = async (key) => {
  const res = await API.get(`/content/${key}`);
  return res.data;
};

export const saveBlock = async (key, data) => {
  const res = await API.post(`/content/save`, {
    key,
    data,
  });
  return res.data;
};