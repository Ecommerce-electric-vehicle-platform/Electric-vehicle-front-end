import axios from "axios";

const adminAxios = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

// Endpoint public cho admin (không cần token)
const publicAdminEndpoints = ["/api/v1/auth/admin/signin"];

// Interceptor: tự động gắn token vào mọi request admin
adminAxios.interceptors.request.use((config) => {
  const isPublic = publicAdminEndpoints.some((url) =>
    config.url.includes(url)
  );

  if (!isPublic) {
    // Sửa ở đây: lấy đúng key đang lưu trong localStorage
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("Không tìm thấy accessToken trong localStorage");
    }
  }

  return config;
});

// Interceptor: Xử lý lỗi tập trung
adminAxios.interceptors.response.use(
  (response) => response,
  (error) => {
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
