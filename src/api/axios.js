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
      
      // Returning a handled error structure stops infinite loops from tools like SWR
      // and provides a clean message to the UI
      return Promise.reject(new Error("Unable to connect to the server. Please ensure the backend is running."));
    }
    return Promise.reject(error);
  }
);

export default API;
