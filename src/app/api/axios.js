// src/api/axios.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", // ⬅️ your backend base
  withCredentials: true,                 // ⬅️ send cookies
  headers: { "Content-Type": "application/json" },
});

export default API;
