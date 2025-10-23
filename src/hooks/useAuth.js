// src/hooks/useAuth.js
import { useState, useEffect, useCallback } from 'react';
import {
    isAuthenticated,
    getCurrentUser,
    clearAuthData,
    logout,
    hasRefreshToken
} from '../utils/authUtils';
import tokenManager from '../utils/tokenManager';

/**
 * Custom hook để quản lý authentication state
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Kiểm tra authentication status
    const checkAuthStatus = useCallback(async () => {
        try {
            setIsLoading(true);

            const authenticated = isAuthenticated();
            const currentUser = getCurrentUser();

            setIsAuthenticated(authenticated);
            setUser(authenticated ? currentUser : null);

            // Nếu có refresh token nhưng access token hết hạn, thử refresh
            if (!authenticated && hasRefreshToken()) {
                try {
                    await tokenManager.refreshAccessToken();
                    const newUser = getCurrentUser();
                    setIsAuthenticated(true);
                    setUser(newUser);
                } catch (error) {
                    console.error('Auto refresh failed:', error);
                    clearAuthData();
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            setIsAuthenticated(false);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Login function
    const login = useCallback((userData) => {
        setUser(userData);
        setIsAuthenticated(true);
    }, []);

    // Logout function
    const handleLogout = useCallback(() => {
        logout();
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    // Refresh user data
    const refreshUser = useCallback(() => {
        const currentUser = getCurrentUser();
        setUser(currentUser);
    }, []);

    // Check if user has specific role
    const hasRole = useCallback((role) => {
        return user?.role === role;
    }, [user]);

    // Check if user is admin
    const isAdmin = useCallback(() => {
        return hasRole('ADMIN');
    }, [hasRole]);

    // Check if user is seller
    const isSeller = useCallback(() => {
        return hasRole('SELLER');
    }, [hasRole]);

    // Check if user is buyer
    const isBuyer = useCallback(() => {
        return hasRole('BUYER');
    }, [hasRole]);

    // Effect để check auth status khi component mount
    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // Effect để listen cho storage changes (từ other tabs)
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'accessToken' || e.key === 'user') {
                checkAuthStatus();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [checkAuthStatus]);

    return {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout: handleLogout,
        refreshUser,
        hasRole,
        isAdmin,
        isSeller,
        isBuyer,
        checkAuthStatus
    };
};

export default useAuth;
