import axios from "axios";

const API = process.env.API_URL || "http://localhost:5000/api/content";

export const getBlock = async (key) => {
  const res = await axios.get(`${API}/${key}`);
  return res.data;
};

export const saveBlock = async (key, data) => {
  const res = await axios.post(`${API}/save`, {
    key,
    data,
  });
  return res.data;
};