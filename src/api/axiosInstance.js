// src/api/axiosInstance.js
import axios from "axios";
import tokenManager from "../utils/tokenManager";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

// ===== DANH SÁCH CÁC ENDPOINT PUBLIC =====
const publicEndpoints = [
  "/api/v1/auth/signup",
  "/api/v1/auth/signin",
  "/api/v1/auth/signin-google",
  "/api/v1/auth/verify-otp",
  "/api/v1/auth/verify-username-forgot-password",
  "/api/v1/auth/verify-otp-forgot-password",
  "/api/v1/auth/forgot-password",
  "/api/v1/auth/refresh-token",
  "/api/v1/auth/admin/signin",
  "/api/v1/auth/admin/refresh-token",
  "/api/v1/vnpay/return",
  // Không nên thêm /api/v1/post-product ở đây, vì seller cần token
];

// ===== INTERCEPTOR REQUEST =====
axiosInstance.interceptors.request.use(async (config) => {
  const isPublic = publicEndpoints.some((url) => config.url.includes(url));

  console.log(
    `📤 [API] ${config.method.toUpperCase()} ${config.url} ${
      isPublic ? "(public)" : "(authenticated)"
    }`
  );

  if (!isPublic) {
    const authType = localStorage.getItem("authType");
    let token = null;

    try {
      if (authType === "admin") {
        token =
          localStorage.getItem("adminToken") ||
          localStorage.getItem("adminAccessToken");
      } else {
        token = await tokenManager.getValidToken();
      }

      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (err) {
      console.warn("⚠️ Không lấy được token hợp lệ:", err);
    }
  }

  return config;
});

// ===== INTERCEPTOR RESPONSE =====
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      `✅ [API] ${response.config.method.toUpperCase()} ${response.config.url} → ${response.status}`
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const data = error?.response?.data;
    const url = originalRequest?.url;

    if (error.response) {
      console.error(
        `❌ [API] ${originalRequest.method.toUpperCase()} ${url} → ${status} ${
          data?.message || ""
        }`
      );
    } else if (error.request) {
      console.error(`❌ [API] No response from Backend for ${url}`);
    } else {
      console.error(`❌ [API] Request error: ${error.message}`);
    }

    // === 401 UNAUTHORIZED: Thử refresh token ===
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const authType = localStorage.getItem("authType");
        let newToken = null;

        if (authType === "admin") {
          // Admin refresh token riêng
          const adminRefreshToken =
            localStorage.getItem("adminRefreshToken") || "";
          const res = await axios.post(
            `${
              import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
            }/api/v1/auth/admin/refresh-token`,
            {},
            { headers: { Authorization: `Bearer ${adminRefreshToken}` } }
          );
          newToken = res?.data?.data?.accessToken;
          localStorage.setItem("adminToken", newToken);
        } else {
          // Buyer/Seller
          newToken = await tokenManager.refreshAccessToken();
        }

        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error("🔴 Refresh token thất bại:", refreshError.message);
        tokenManager.clearTokens();

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("auth:refresh-failed", {
              detail: { reason: refreshError?.message || "unknown" },
            })
          );
        }
        return Promise.reject(refreshError);
      }
    }

    const message =
      data?.message ||
      data?.error ||
      (status === 500 && "Lỗi máy chủ (500). Vui lòng thử lại sau.") ||
      (status === 404 && "Không tìm thấy tài nguyên (404).") ||
      (status === 401 && "Chưa được xác thực (401).") ||
      (status === 403 && "Không có quyền truy cập (403).") ||
      error?.message ||
      "Đã xảy ra lỗi không xác định.";

    console.error(`API Error [${status || "n/a"}] ${url || ""}: ${message}`);

    return Promise.reject({
      message,
      status,
      url,
      data,
      original: error,
    });
  }
);

export default axiosInstance;
