// src/utils/authUtils.js
import tokenManager from "./tokenManager";

/**
 *  Lưu thông tin đăng nhập sau khi signin thành công
 * @param {Object} data - Dữ liệu từ API /auth/signin
 */
export function saveAuthData(data) {
  if (!data) return;

  const {
    accessToken,
    refreshToken,
    username,
    email,
    sellerId,
    buyerId,
  } = data;

  // --- B1: Lưu token ---
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("token", accessToken); // Cho websocket & api cũ
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }

  // --- B2: Lưu thông tin cơ bản ---
  if (username) localStorage.setItem("username", username);
  if (email) localStorage.setItem("userEmail", email);
  if (buyerId) localStorage.setItem("buyerId", buyerId);

  // --- B3: Xác định vai trò ---
  if (sellerId) {
    localStorage.setItem("authType", "seller");
    localStorage.setItem("sellerId", sellerId);
    console.log("[AuthUtils] Detected SELLER role");
  } else {
    localStorage.setItem("authType", "user");
    localStorage.removeItem("sellerId");
    console.log("[AuthUtils] Detected BUYER role");
  }

  // --- B4: Bắn event cho FE cập nhật Header / Navbar ---
  window.dispatchEvent(new CustomEvent("authStatusChanged"));
  console.log("[AuthUtils] Auth data saved successfully");
}

/**
 *  Xóa toàn bộ thông tin khi logout hoặc refresh fail
 */
export function clearAuthData() {
  const keysToClear = [
    "accessToken",
    "refreshToken",
    "token",
    "username",
    "userEmail",
    "buyerId",
    "buyerAvatar",
    "authType",
    "sellerId",
    "adminAuthType",
    "adminToken",
    "adminRefreshToken",
    "adminProfile",
  ];
  keysToClear.forEach((key) => localStorage.removeItem(key));
  console.log("[AuthUtils] Cleared all auth data");

  window.dispatchEvent(new CustomEvent("authStatusChanged"));
}

/**
 *  Kiểm tra có đang đăng nhập không
 */
export function isAuthenticated() {
  const token = localStorage.getItem("accessToken");
  return !!token && !isTokenExpired(token);
}

/**
 *  Kiểm tra token có hết hạn chưa
 */
export function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Date.now() > payload.exp * 1000;
  } catch {
    return true;
  }
}

/**
 *  Lấy token hợp lệ (tự refresh nếu cần)
 */
export async function getValidToken() {
  return await tokenManager.getValidToken();
}

/**
 *  Logout user & điều hướng về trang chủ
 */
export function logout() {
  clearAuthData();
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}
