// src/utils/tokenManager.js
import authApi from '../api/authApi';

class TokenManager {
    constructor() {
        this.isRefreshing = false;
        this.failedQueue = [];
    }

    // Lưu tokens vào localStorage
    setTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    // Lấy access token
    getAccessToken() {
        return localStorage.getItem('accessToken');
    }

    // Lấy refresh token
    getRefreshToken() {
        return localStorage.getItem('refreshToken');
    }

    // Xóa tất cả tokens
    clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('token'); // Legacy token
    }

    // Kiểm tra xem có refresh token không
    hasRefreshToken() {
        return !!this.getRefreshToken();
    }

    // Xử lý refresh token
    async refreshAccessToken() {
        // Nếu đang refresh, đợi kết quả
        if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
            });
        }

        this.isRefreshing = true;

        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await authApi.refreshToken(refreshToken);
            console.log('Refresh token response:', response.data);

            // Parse response data - có thể có structure khác nhau
            let accessToken, newRefreshToken;

            if (response.data && response.data.data) {
                // Structure: { success: true, message: "...", data: { accessToken, refreshToken } }
                accessToken = response.data.data.accessToken;
                newRefreshToken = response.data.data.refreshToken;
            } else if (response.data) {
                // Structure: { accessToken, refreshToken }
                accessToken = response.data.accessToken;
                newRefreshToken = response.data.refreshToken;
            } else {
                throw new Error('Invalid response structure from refresh token endpoint');
            }

            // Lưu tokens mới
            this.setTokens(accessToken, newRefreshToken);

            // Xử lý các request đang chờ
            this.processQueue(null, accessToken);

            return accessToken;
        } catch (error) {
            // Xử lý các request đang chờ với lỗi
            this.processQueue(error, null);

            // Xóa tokens nếu refresh thất bại
            this.clearTokens();

            // Phát ra sự kiện để UI có thể tự xử lý (hiển thị modal, v.v.)
            if (typeof window !== 'undefined') {
                try {
                    window.dispatchEvent(new CustomEvent('auth:refresh-failed', { detail: { reason: error?.message || 'unknown' } }));
                } catch { }
            }

            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    // Xử lý queue các request đang chờ
    processQueue(error, token = null) {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });

        this.failedQueue = [];
    }

    // Kiểm tra token có hết hạn không (dựa trên JWT payload)
    isTokenExpired(token) {
        if (!token) return true;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    // Lấy token hợp lệ (kiểm tra và refresh nếu cần)
    async getValidToken() {
        const accessToken = this.getAccessToken();

        if (!accessToken) {
            throw new Error('No access token available');
        }

        // Kiểm tra token có hết hạn không
        if (this.isTokenExpired(accessToken)) {
            if (!this.hasRefreshToken()) {
                throw new Error('Token expired and no refresh token available');
            }

            return await this.refreshAccessToken();
        }

        return accessToken;
    }
}

// Export singleton instance
export default new TokenManager();
