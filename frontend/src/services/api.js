// import axios from "axios";

// export const backend = axios.create({
//   baseURL: "http://localhost:5001",
//   withCredentials: true,
// });

// export const faceApi = axios.create({
//   baseURL: "http://localhost:5000",
// });

import axios from "axios";

// Look for production URLs first, fallback to localhost for local development
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5001";
const FACE_API_URL =
  import.meta.env.VITE_FACE_API_URL || "http://localhost:5000";

export const backend = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});

export const faceApi = axios.create({
  baseURL: FACE_API_URL,
});
