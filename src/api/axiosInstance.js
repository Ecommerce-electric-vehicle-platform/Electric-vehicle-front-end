// src/api/axiosInstance.js
import axios from "axios";

//Tạo instance cho người dùng (buyer/seller)
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

//Danh sách các endpoint PUBLIC — KHÔNG cần token
const publicEndpoints = [
  "/api/v1/auth/signup",
  "/api/v1/auth/signin",
  "/api/v1/auth/signin-google",
  "/api/v1/auth/verify-otp",
  "/api/v1/auth/verify-username-forgot-password",
  "/api/v1/auth/verify-otp-forgot-password",
  "/api/v1/auth/forgot-password",
  // VNPay return là public do gateway redirect về
  "/api/v1/vnpay/return",
  // Sản phẩm: hiển thị công khai trang chủ và danh sách
  "/api/v1/post-product",
];

//Interceptor: Gắn token người dùng vào request
axiosInstance.interceptors.request.use((config) => {
  const isPublic = publicEndpoints.some((url) => config.url.includes(url));

  if (!isPublic) {
    // Token của người dùng (buyer/seller)
    const userToken =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
  }

  return config;
});

// Interceptor: Xử lý lỗi tập trung cho người dùng
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const url = error?.config?.url;

    const message =
      data?.message ||
      data?.error ||
      data?.error_description ||
      (status === 500 ? "Lỗi máy chủ (500). Vui lòng thử lại sau." : undefined) ||
      (status === 404 ? "Không tìm thấy tài nguyên (404)." : undefined) ||
      (status === 401 ? "Chưa được xác thực (401)." : undefined) ||
      (status === 403 ? "Không có quyền truy cập (403)." : undefined) ||
      error?.message ||
      "Đã xảy ra lỗi không xác định.";

    // In ra console: chuỗi dễ đọc + raw details để trace
    console.error(`API Error [${status || "n/a"}] ${url || ""}: ${message}`, data || "");

    // Chuẩn hoá object reject để các nơi .catch() có thể dùng trực tiếp
    const normalizedError = {
      message,
      status,
      url,
      data,
      original: error,
    };

    return Promise.reject(normalizedError);
  }
);

export default axiosInstance;
