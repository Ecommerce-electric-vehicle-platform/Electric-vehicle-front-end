// src/api/authApi.js
import axiosInstance from "./axiosInstance";
import axios from "axios";
import { saveAuthData } from "../utils/authUtils";

// === Instance riêng cho refresh token (không bị interceptor chặn) ===
const refreshAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

const authApi = {
  // ===== User Signup =====
  signup: (data) => axiosInstance.post("/api/v1/auth/signup", data),

  // ===== User Signin =====
  signin: async (data) => {
    const response = await axiosInstance.post("/api/v1/auth/signin", data);
    const result = response?.data?.data;

    // Nếu có token thì lưu tạm
    if (result?.accessToken) {
      saveAuthData({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        username: result.username,
        email: result.email,
        buyerId: result.buyerId,
      });
    }

    return response;
  },

  // ===== Admin Signin =====
  adminSignin: async (data) => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/v1/auth/admin/signin`,
      data,
      { headers: { "Content-Type": "application/json" } }
    );

    // Response mới có cấu trúc: { success, message, data: { adminResponse, accessToken, refreshToken, role } }
    const responseData = response?.data?.data;
    const adminResponse = responseData?.adminResponse || {};

    if (responseData?.accessToken) {
      // Lưu token riêng cho admin
      localStorage.setItem("adminToken", responseData.accessToken);
      localStorage.setItem("adminRefreshToken", responseData.refreshToken || "");
      localStorage.setItem("adminAuthType", "admin");
      
      // Lưu role nếu có
      if (responseData?.role) {
        localStorage.setItem("adminRole", responseData.role);
      }
    }

    return response;
  },

  // ===== Verify OTP =====
  verifyOtp: (data) => axiosInstance.post("/api/v1/auth/verify-otp", data),

  // ===== Google Signin =====
  googleSignin: async (idToken) => {
    const response = await axiosInstance.post("/api/v1/auth/signin-google", { idToken });
    const result = response?.data?.data;

    if (result?.accessToken) {
      saveAuthData({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        username: result.username,
        email: result.email,
      });
    }

    return response;
  },

  // ===== Forgot Password =====
  verifyUsernameForgotPassword: (data) =>
    axiosInstance.post("/api/v1/auth/verify-username-forgot-password", data),

  verifyOtpForgotPassword: (data) =>
    axiosInstance.post("/api/v1/auth/verify-otp-forgot-password", data),

  forgotPassword: (data) =>
    axiosInstance.post("/api/v1/auth/forgot-password", data),

  // ===== Refresh Token cho User =====
  refreshToken: async (refreshToken) => {
    return await refreshAxiosInstance.post(
      "/api/v1/auth/refresh-token",
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
  },

  // ===== Refresh Token cho Admin =====
  adminRefreshToken: async (adminRefreshToken) => {
    return await refreshAxiosInstance.post(
      "/api/v1/auth/admin/refresh-token",
      {},
      {
        headers: {
          Authorization: `Bearer ${adminRefreshToken}`,
        },
      }
    );
  },
};

export default authApi;
