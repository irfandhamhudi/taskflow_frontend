// src/utils/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/`,
  withCredentials: true, // penting untuk cookie token
});

export default api;