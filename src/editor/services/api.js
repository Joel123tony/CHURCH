import axios from "axios";

const API = "http://localhost:5000/api/content";

/**
 * GET content block from backend
 */
export const getBlock = async (key) => {
  const res = await axios.get(`${API}/${key}`);
  return res.data;
};

/**
 * SAVE content block to backend
 */
export const saveBlock = async (key, data) => {
  const res = await axios.post(`${API}/save`, {
    key,
    data,
  });
  return res.data;
};