import axios from "axios";

// Resolve API base URL from Vite environment variable or local default
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_BASE = rawApiUrl.replace(/\/api\/?$/, "");
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE;

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Allow browser to calculate multipart boundary for FormData
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else if (!config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clean up and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register" &&
        window.location.pathname !== "/" &&
        window.location.pathname !== "/forgot-password"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
