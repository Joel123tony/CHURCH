import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : import.meta.env.DEV
    ? "http://127.0.0.1:5000/api"
    : "https://church-rp0n.onrender.com/api";

const API = axios.create({
  baseURL,
});

/* TOKEN INTERCEPTOR */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (
      token &&
      token !== "null" &&
      token !== "undefined"
    ) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
