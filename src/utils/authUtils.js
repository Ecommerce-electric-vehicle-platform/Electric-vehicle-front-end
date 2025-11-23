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
      const storageKey = `orders_${username}`;
      const legacyOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      if (Array.isArray(legacyOrders) && legacyOrders.length > 0) {
        const userOrders = legacyOrders.filter(order => {
          if (!order) return false;
          const orderUsername = order.username || order.userId || order.createdBy || '';
          return !orderUsername || orderUsername === username;
        });
        if (userOrders.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(userOrders));
          console.log(`[AuthUtils] Migrated ${userOrders.length} orders to per-user storage (${storageKey}).`);
        }
        localStorage.removeItem('orders');
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
 *  ✅ SỬA: Chỉ xóa user data, không xóa adminProfile nếu authType = "admin"
 */
export function clearAuthData() {
  const authType = localStorage.getItem("authType");
  
  // ✅ Nếu đang là admin session, chỉ xóa token, giữ lại adminProfile
  if (authType === "admin") {
    const keysToClear = [
      "accessToken",
      "refreshToken",
      "token",
      "authType",
    ];
    keysToClear.forEach((key) => localStorage.removeItem(key));
    console.log("[AuthUtils] Cleared admin tokens only (kept adminProfile)");
  } else {
    // Xóa user data bình thường
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
      "userRole",
      "adminAuthType",
      "adminToken",
      "adminRefreshToken",
      // ✅ KHÔNG xóa adminProfile ở đây vì function này dùng cho user logout
    ];
    keysToClear.forEach((key) => localStorage.removeItem(key));
    console.log("[AuthUtils] Cleared user auth data");
  }

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
 *  Lấy thông tin user hiện tại từ localStorage
 */
export function getCurrentUser() {
  const username = localStorage.getItem("username");
  const email = localStorage.getItem("userEmail");
  const authType = localStorage.getItem("authType");
  const sellerId = localStorage.getItem("sellerId");
  const buyerId = localStorage.getItem("buyerId");
  const userRole = localStorage.getItem("userRole");

  // Xác định role từ authType hoặc userRole
  let role = null;
  if (authType === "seller" || userRole === "seller" || sellerId) {
    role = "SELLER";
  } else if (authType === "user" || userRole === "buyer" || buyerId) {
    role = "BUYER";
  }

  if (!username && !email) {
    return null;
  }

  return {
    username,
    email,
    role,
    sellerId,
    buyerId,
    authType,
  };
}

/**
 *  Kiểm tra có refresh token không
 */
export function hasRefreshToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  return !!refreshToken;
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
