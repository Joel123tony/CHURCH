import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "/api";

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

/* RESPONSE INTERCEPTOR */
let networkErrorLogged = false;

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.code === 'ECONNREFUSED') {
      if (!networkErrorLogged) {
        console.error("Unable to connect to the server. Please ensure the backend is running.");
        networkErrorLogged = true;
      }
      return Promise.reject(new Error("Unable to connect to the server. Please ensure the backend is running."));
    }

    // Handle 401 Unauthorized (invalid or expired token)
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Prevent redirect loop if already on login page
      if (window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
      
      return Promise.reject(new Error("Session expired. Please log in again."));
    }

    return Promise.reject(error);
  }
);

export default API;
