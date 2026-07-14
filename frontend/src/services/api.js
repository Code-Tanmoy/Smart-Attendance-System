import axios from "axios";

// Look for production URLs first, fallback to localhost for local development
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
const FACE_API_URL =
  import.meta.env.VITE_FACE_API_URL || "http://localhost:5000";

export const backend = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

// 🟢 NEW: Global Interceptor to catch 401 Unauthorized errors and break the loop
backend.interceptors.response.use(
  (response) => response, // If successful, let it pass through
  (error) => {
    // If the backend rejects the request because the cookie is expired/missing
    if (error.response && error.response.status === 401) {
      console.warn(
        "Session expired. Clearing local storage and redirecting...",
      );

      // 1. Kill the ghost session
      localStorage.clear();

      // 2. Safely redirect ONLY if we aren't already on the login page
      if (
        window.location.pathname !== "/signin" &&
        window.location.pathname !== "/"
      ) {
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  },
);

export const faceApi = axios.create({
  baseURL: FACE_API_URL,
});
