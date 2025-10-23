// src/utils/authUtils.js
import tokenManager from './tokenManager';

// Utility functions để quản lý authentication

/**
 * Lưu thông tin đăng nhập sau khi signin thành công
 * @param {Object} authData - Dữ liệu từ API response
 * @param {string} authData.accessToken - Access token
 * @param {string} authData.refreshToken - Refresh token
 * @param {Object} authData.user - Thông tin user
 */
export const saveAuthData = (authData) => {
    const { accessToken, refreshToken, user } = authData;

    // Lưu tokens
    tokenManager.setTokens(accessToken, refreshToken);

    // Lưu thông tin user
    if (user) {
        localStorage.setItem('user', JSON.stringify(user));
    }

    console.log('Auth data saved successfully');
};

/**
 * Xóa tất cả dữ liệu authentication
 */
export const clearAuthData = () => {
    tokenManager.clearTokens();
    localStorage.removeItem('user');
    console.log('Auth data cleared');
};

/**
 * Kiểm tra xem user có đăng nhập không
 * @returns {boolean}
 */
export const isAuthenticated = () => {
    const accessToken = tokenManager.getAccessToken();
    return !!accessToken && !tokenManager.isTokenExpired(accessToken);
};

/**
 * Lấy thông tin user hiện tại
 * @returns {Object|null}
 */
export const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing user data:', error);
        return null;
    }
};

/**
 * Kiểm tra xem có refresh token không
 * @returns {boolean}
 */
export const hasRefreshToken = () => {
    return tokenManager.hasRefreshToken();
};

/**
 * Lấy token hợp lệ (tự động refresh nếu cần)
 * @returns {Promise<string>}
 */
export const getValidToken = async () => {
    return await tokenManager.getValidToken();
};

/**
 * Logout user
 */
export const logout = () => {
    clearAuthData();

    // Redirect về trang chủ hoặc login
    if (typeof window !== 'undefined') {
        window.location.href = '/';
    }
};

/**
 * Kiểm tra token có hết hạn không
 * @param {string} token - Token cần kiểm tra
 * @returns {boolean}
 */
export const isTokenExpired = (token) => {
    return tokenManager.isTokenExpired(token);
};

/**
 * Lấy thời gian hết hạn của token (timestamp)
 * @param {string} token - JWT token
 * @returns {number|null}
 */
export const getTokenExpiration = (token) => {
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000; // Convert to milliseconds
    } catch (error) {
        return null;
    }
};

/**
 * Kiểm tra token sắp hết hạn (trong vòng 5 phút)
 * @param {string} token - JWT token
 * @returns {boolean}
 */
export const isTokenExpiringSoon = (token) => {
    if (!token) return true;

    const expiration = getTokenExpiration(token);
    if (!expiration) return true;

    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return (expiration - Date.now()) < fiveMinutes;
};
