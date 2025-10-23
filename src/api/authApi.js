// src/api/authApi.js
import axiosInstance from "./axiosInstance";
import { saveAuthData } from "../utils/authUtils";

const authApi = {
  signup: (data) => axiosInstance.post("/api/v1/auth/signup", data),

  // Signin với tự động lưu tokens
  signin: async (data) => {
    const response = await axiosInstance.post("/api/v1/auth/signin", data);
    if (response.data.accessToken) {
      saveAuthData(response.data);
    }
    return response;
  },

  // Admin-only signin với tự động lưu tokens
  adminSignin: async (data) => {
    const response = await axiosInstance.post("/api/v1/auth/admin/signin", data);
    if (response.data.accessToken) {
      saveAuthData(response.data);
    }
    return response;
  },

  verifyOtp: (data) => axiosInstance.post("/api/v1/auth/verify-otp", data),

  // Google signin với tự động lưu tokens
  googleSignin: async (token) => {
    const response = await axiosInstance.post("/api/v1/auth/signin-google", { idToken: token });
    if (response.data.accessToken) {
      saveAuthData(response.data);
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

  // ===== Refresh Token =====
  refreshToken: (refreshToken) =>
    axiosInstance.post("/api/v1/auth/refresh-token", { refreshToken }),
};

export default authApi;
