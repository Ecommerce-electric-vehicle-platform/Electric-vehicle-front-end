// src/api/authApi.js
import axiosInstance from "./axiosInstance";

const authApi = {
  signup: (data) => axiosInstance.post("/api/v1/auth/signup", data),
  signin: (data) => axiosInstance.post("/api/v1/auth/signin", data),
  // Admin-only signin
  adminSignin: (data) => axiosInstance.post("/api/v1/auth/admin/signin", data),
  verifyOtp: (data) => axiosInstance.post("/api/v1/auth/verify-otp", data),
  googleSignin: (token) =>
    axiosInstance.post("/api/v1/auth/signin-google", { idToken: token }),

  // ===== Forgot Password =====
  verifyUsernameForgotPassword: (data) =>
    axiosInstance.post("/api/v1/auth/verify-username-forgot-password", data),
  verifyOtpForgotPassword: (data) =>
    axiosInstance.post("/api/v1/auth/verify-otp-forgot-password", data),
  forgotPassword: (data) =>
    axiosInstance.post("/api/v1/auth/forgot-password", data),
};

export default authApi;
