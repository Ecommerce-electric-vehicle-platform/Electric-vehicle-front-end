import axios from "axios";

const adminAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

// Endpoint public cho admin (không cần token)
const publicAdminEndpoints = [
  "/api/v1/auth/admin/signin",
  "/api/v1/auth/refresh-token" // Refresh token endpoint cũng là public
];

// Interceptor: tự động gắn token vào mọi request admin
adminAxios.interceptors.request.use(async (config) => {
  const isPublic = publicAdminEndpoints.some((url) =>
    config.url.includes(url)
  );

  if (!isPublic) {
    // Sử dụng adminToken cho các request admin
    const adminToken =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("adminAccessToken");

    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else {
      console.warn("Không tìm thấy adminToken trong localStorage");
    }
  }

  return config;
});

// Interceptor: Xử lý lỗi tập trung
adminAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    // Xử lý lỗi 401 - Unauthorized cho admin
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Thử refresh admin token
        const adminRefreshToken =
          localStorage.getItem("adminRefreshToken") || "";
        
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/v1/auth/admin/refresh-token`,
          {},
          { headers: { Authorization: `Bearer ${adminRefreshToken}` } }
        );
        
        const newToken = res?.data?.data?.accessToken;
        if (newToken) {
          localStorage.setItem("adminToken", newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return adminAxios(originalRequest);
        }
      } catch (refreshError) {
        // Nếu refresh thất bại, xóa tokens và redirect về admin login
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminRefreshToken");

        // Redirect về admin login page
        if (typeof window !== 'undefined') {
          window.location.href = '/admin/login';
        }

        return Promise.reject(refreshError);
      }
    }

    console.error("Admin API Error:", error.response?.data || error.message);

    if (error.response && error.response.data) {
      const message =
        error.response.data.message ||
        error.response.data.error ||
        error.response.data.error_description ||
        "Đã xảy ra lỗi từ máy chủ (admin).";
      error.message = message;
    } else {
      error.message = "Không thể kết nối đến máy chủ.";
    }

    return Promise.reject(error);
  }
);

export default adminAxios;
