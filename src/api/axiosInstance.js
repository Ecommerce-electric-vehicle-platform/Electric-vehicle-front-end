// src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

axiosInstance.interceptors.request.use((config) => {
  // Danh sách các endpoint không cần token
  const publicEndpoints = [
    "/api/v1/auth/signup",
    "/api/v1/auth/signin",
    "/api/v1/auth/verify-otp",
    "/api/v1/auth/signin-google",
    "/api/v1/auth/verify-username-forgot-password",
    "/api/v1/auth/verify-otp-forgot-password",
    "/api/v1/auth/forgot-password",
  ];

  const isPublic = publicEndpoints.some((url) => config.url.includes(url));

  // Chỉ thêm token nếu không phải là endpoint public
  if (!isPublic) {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default axiosInstance;
