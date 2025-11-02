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

  // --- B4: Cleanup orders trong localStorage của user cũ khi login user mới ---
  // QUAN TRỌNG: localStorage orders phải được filter theo username hiện tại
  // Khi login user mới, xóa orders của user cũ để tránh hiển thị sai
  try {
    if (username) {
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      if (Array.isArray(allOrders) && allOrders.length > 0) {
        // Chỉ giữ orders của user hiện tại
        const userOrders = allOrders.filter(order => {
          if (!order) return false;
          const orderUsername = order.username || order.userId || order.createdBy || '';
          return orderUsername === username;
        });

        // Nếu có orders không thuộc user hiện tại, xóa chúng
        if (userOrders.length !== allOrders.length) {
          const removedCount = allOrders.length - userOrders.length;
          console.log(`[AuthUtils] Cleaned up ${removedCount} orders from localStorage that don't belong to user ${username}`);
          localStorage.setItem('orders', JSON.stringify(userOrders));
        }
      }
    }
  } catch (e) {
    console.warn('[AuthUtils] Failed to cleanup localStorage orders:', e);
  }

  // --- B5: Bắn event cho FE cập nhật Header / Navbar ---
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
