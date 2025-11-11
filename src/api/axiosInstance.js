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
  // Post product public endpoints
  //"/api/v1/post-product",
  // Seller public endpoints (view only)

];

// ===== INTERCEPTOR REQUEST =====
axiosInstance.interceptors.request.use(async (config) => {
  const isPublic = publicEndpoints.some((url) => config.url.includes(url));

  console.log(
    `[API] ${config.method.toUpperCase()} ${config.url} ${isPublic ? "(public)" : "(authenticated)"
    }`
  );

  // Log request body cho place-order để debug shipping fee
  if (config.url.includes('/buyer/place-order') && config.data) {
    console.log('[API] Place Order Request Body:', {
      postProductId: config.data.postProductId,
      shippingFee: config.data.shippingFee,  // ← Giá từ API /shipping-fee
      productPrice: config.data.productPrice,
      totalPrice: config.data.totalPrice,
      shippingPartnerId: config.data.shippingPartnerId,
      paymentId: config.data.paymentId,
      fullBody: config.data
    });
    console.log('⚠️ [IMPORTANT] Backend MUST use shippingFee from request:', {
      shippingFee_from_request: config.data.shippingFee,
      source: 'API /api/v1/shipping/shipping-fee',
      warning: 'Backend should NOT recalculate. If backend recalculates, it will be DIFFERENT!',
      expected_in_database: config.data.shippingFee
    });
  }

  // Xử lý FormData: Xóa Content-Type header để axios tự động set với boundary
  // Khi gửi FormData, axios cần tự động set Content-Type: multipart/form-data; boundary=...
  // Nếu để default "application/json" hoặc set thủ công không có boundary, backend sẽ reject
  // 
  // Logic:
  // 1. Nếu data là FormData → xóa Content-Type → axios tự set với boundary
  // 2. Nếu data không phải FormData → giữ nguyên default "application/json" từ config
  // 3. Điều này KHÔNG ảnh hưởng các API khác vì:
  //    - API JSON: data là object/string → không phải FormData → giữ nguyên Content-Type
  //    - API FormData: data là FormData → xóa Content-Type → axios set đúng với boundary
  if (config.data instanceof FormData) {
    // Xóa Content-Type để axios tự động thêm boundary
    delete config.headers["Content-Type"];
    // Log để debug (có thể comment lại sau)
    console.log("[API] FormData detected - Removing Content-Type, axios will auto-set with boundary");
  }

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
      console.warn("Không lấy được token hợp lệ:", err);
    }
  }

  return config;
});

// ===== INTERCEPTOR RESPONSE =====
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(
      `[API] ${response.config.method.toUpperCase()} ${response.config.url} → ${response.status}`
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
        `[API] ${originalRequest.method.toUpperCase()} ${url} → ${status} ${data?.message || ""
        }`
      );
    } else if (error.request) {
      console.error(`[API] No response from Backend for ${url}`);
    } else {
      console.error(`[API] Request error: ${error.message}`);
    }

    // === 401 UNAUTHORIZED: Thử refresh token ===
    // QUAN TRỌNG: Không refresh token cho public endpoints (signin, signup, etc.)
    // vì những endpoint này không cần token và 401 ở đây là lỗi đăng nhập, không phải token hết hạn
    const isPublicEndpoint = publicEndpoints.some((endpoint) => 
      originalRequest?.url?.includes(endpoint)
    );
    
    if (status === 401 && !originalRequest._retry && !isPublicEndpoint) {
      originalRequest._retry = true;
      try {
        const authType = localStorage.getItem("authType");
        let newToken = null;

        if (authType === "admin") {
          // Admin refresh token riêng
          const adminRefreshToken =
            localStorage.getItem("adminRefreshToken") || "";
          const res = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
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
        console.error("Refresh token thất bại:", refreshError.message);
        tokenManager.clearTokens();

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("auth:refresh-failed", {
              detail: { reason: refreshError?.message || "unknown" },
            })
          );
        }
        // QUAN TRỌNG: Reject với error gốc, không phải refreshError
        // để component có thể xử lý lỗi đúng từ backend
        return Promise.reject(error);
      }
    }

    // Giữ nguyên lỗi gốc từ backend để component có thể xử lý cụ thể
    // Chỉ thêm thông tin bổ sung mà không thay đổi cấu trúc gốc
    const enhancedError = {
      ...error,
      response: {
        ...error.response,
        data: data, // Giữ nguyên data gốc từ backend
      },
      // Thêm thông tin bổ sung
      _enhanced: {
        status,
        url,
        timestamp: new Date().toISOString(),
      }
    };

    // In ra console: chuỗi dễ đọc + raw details để trace
    console.error(`API Error [${status || "n/a"}] ${url || ""}:`, data || "");

    return Promise.reject(enhancedError);
  }
);

export default axiosInstance;
