// src/utils/api.ts
import axios from "axios";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const cleanApiUrl = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;

const api = axios.create({
  baseURL: `${cleanApiUrl}/api/`,
  withCredentials: true, // penting untuk cookie token
});

// Request interceptor to attach Authorization header if token exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;