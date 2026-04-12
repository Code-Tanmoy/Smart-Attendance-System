import axios from "axios";

export const backend = axios.create({
  baseURL: "http://localhost:5001",
  withCredentials: true,
});

export const faceApi = axios.create({
  baseURL: "http://localhost:5000",
});
