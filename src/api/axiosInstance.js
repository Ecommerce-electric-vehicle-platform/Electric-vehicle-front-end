// // src/api/axiosInstance.js
// import axios from "axios";

// const axiosInstance = axios.create({
//     baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
//     headers: { "Content-Type": "application/json" },
// });

// // interceptor tự động thêm token
// axiosInstance.interceptors.request.use((config) => {
//     const token = localStorage.getItem("accessToken");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
// });

// export default axiosInstance;



// 📂 src/api/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
    headers: { "Content-Type": "application/json" },
});

// ✅ Danh sách endpoint PUBLIC — KHÔNG đính token
const publicEndpoints = [
    "/api/v1/auth/signup",
    "/api/v1/auth/signin",
    "/api/v1/auth/verify-otp",
    "/api/v1/auth/forgot-password",
    "/api/v1/auth/verify-forgot-password",
];

// ✅ Request interceptor
axiosInstance.interceptors.request.use((config) => {
    const isPublic = publicEndpoints.some((url) => config.url.includes(url));

    if (!isPublic) {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    return config;
});

// ✅ Response interceptor — xử lý lỗi tập trung
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("❌ API Error:", error.response?.data || error.message);

        if (error.response && error.response.data) {
            const message =
                error.response.data.message ||
                error.response.data.error ||
                error.response.data.error_description ||
                "Đã xảy ra lỗi từ server.";

            // Gắn lại message để FE có thể lấy ra dễ dàng
            error.message = message;
        } else {
            error.message = "Không thể kết nối đến máy chủ.";
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
