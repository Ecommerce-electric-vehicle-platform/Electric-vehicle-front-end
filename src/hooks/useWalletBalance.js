import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

/**
 * Custom hook để quản lý số dư ví của người dùng
 * @returns {Object} { balance, loading, error, refreshBalance }
 */
export const useWalletBalance = () => {
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Format số tiền theo định dạng VNĐ (giống Profile)
     * @param {number} amount - Số tiền cần format
     * @returns {string} Số tiền đã format (ví dụ: 500.000₫)
     */
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "—";
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    /**
     * Gọi API để lấy số dư ví
     */
    const fetchWalletBalance = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Fetching wallet balance from API...');
            const response = await axiosInstance.get('/api/v1/buyer/wallet');

            console.log('✅ Wallet API response:', response.data);

            // Parse response theo cấu trúc giống Profile
            let walletBalance = 0;

            if (response.data && response.data.data) {
                // Cấu trúc: response.data.data.balance (như Profile)
                walletBalance = response.data.data.balance || 0;
                console.log('💰 Found balance in response.data.data.balance:', walletBalance);
            } else if (response.data && response.data.balance !== undefined) {
                // Fallback: response.data.balance
                walletBalance = response.data.balance;
                console.log('💰 Found balance in response.data.balance:', walletBalance);
            } else {
                console.log('❌ No balance found in response structure');
                console.log('🔍 Available response keys:', Object.keys(response.data || {}));
            }

            console.log('💰 Final extracted wallet balance:', walletBalance);

            // Đảm bảo balance là số
            const numericBalance = typeof walletBalance === 'number' ? walletBalance : 0;
            setBalance(numericBalance);

        } catch (error) {
            console.error('❌ Error fetching wallet balance:', error);
            setError('Không thể tải số dư ví');
            setBalance(0);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Refresh số dư ví (có thể gọi từ bên ngoài)
     */
    const refreshBalance = useCallback(() => {
        fetchWalletBalance();
    }, [fetchWalletBalance]);

    // Tự động gọi API khi component mount
    useEffect(() => {
        fetchWalletBalance();
    }, [fetchWalletBalance]);

    return {
        balance,
        loading,
        error,
        refreshBalance,
        formatCurrency
    };
};
