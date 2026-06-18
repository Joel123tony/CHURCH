  import axios from "axios";

  const API = axios.create({
    baseURL: "https://church-rp0n.onrender.com/api",
  });

  /* ================= TOKEN ATTACH INTERCEPTOR ================= */
  API.interceptors.request.use(
    (config) => {
      const token = sessionStorage.getItem("token");

      // safety check
      if (token && token !== "null" && token !== "undefined") {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  export default API;