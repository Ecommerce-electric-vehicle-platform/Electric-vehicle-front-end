// src/components/ExampleAuthUsage.jsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { isAuthenticated, getCurrentUser, logout } from '../utils/authUtils';

/**
 * Ví dụ về cách sử dụng hệ thống refresh token
 * Component này minh họa các cách khác nhau để sử dụng authentication
 */
const ExampleAuthUsage = () => {
    const {
        user,
        isAuthenticated: isAuth,
        isLoading,
        logout: hookLogout,
        hasRole,
        isAdmin,
        isSeller,
        isBuyer
    } = useAuth();

    // Sử dụng utility functions
    const handleUtilityCheck = () => {
        console.log('Is authenticated (utility):', isAuthenticated());
        console.log('Current user (utility):', getCurrentUser());
    };

    // Sử dụng hook functions
    const handleHookCheck = () => {
        console.log('Is authenticated (hook):', isAuth);
        console.log('Current user (hook):', user);
        console.log('Is admin:', isAdmin());
        console.log('Is seller:', isSeller());
        console.log('Is buyer:', isBuyer());
    };

    // Logout sử dụng utility
    const handleUtilityLogout = () => {
        logout();
    };

    // Logout sử dụng hook
    const handleHookLogout = () => {
        hookLogout();
    };

    if (isLoading) {
        return <div className="p-4">Loading authentication status...</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Authentication System Example</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Authentication Status */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Authentication Status</h2>
                    <div className="space-y-2">
                        <p><strong>Is Authenticated:</strong> {isAuth ? 'Yes' : 'No'}</p>
                        <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
                        {user && (
                            <>
                                <p><strong>User Name:</strong> {user.name || 'N/A'}</p>
                                <p><strong>User Email:</strong> {user.email || 'N/A'}</p>
                                <p><strong>User Role:</strong> {user.role || 'N/A'}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Role Checks */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Role Checks</h2>
                    <div className="space-y-2">
                        <p><strong>Is Admin:</strong> {isAdmin() ? 'Yes' : 'No'}</p>
                        <p><strong>Is Seller:</strong> {isSeller() ? 'Yes' : 'No'}</p>
                        <p><strong>Is Buyer:</strong> {isBuyer() ? 'Yes' : 'No'}</p>
                        <p><strong>Has Role 'ADMIN':</strong> {hasRole('ADMIN') ? 'Yes' : 'No'}</p>
                    </div>
                </div>

                {/* Utility Functions Test */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Utility Functions Test</h2>
                    <div className="space-y-2">
                        <button
                            onClick={handleUtilityCheck}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Check Auth Status (Utility)
                        </button>
                        <button
                            onClick={handleUtilityLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            Logout (Utility)
                        </button>
                    </div>
                </div>

                {/* Hook Functions Test */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-4">Hook Functions Test</h2>
                    <div className="space-y-2">
                        <button
                            onClick={handleHookCheck}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Check Auth Status (Hook)
                        </button>
                        <button
                            onClick={handleHookLogout}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            Logout (Hook)
                        </button>
                    </div>
                </div>
            </div>

            {/* Usage Instructions */}
            <div className="mt-8 bg-gray-100 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Usage Instructions</h2>
                <div className="text-sm space-y-2">
                    <p><strong>1. useAuth Hook:</strong> Sử dụng trong React components để quản lý authentication state</p>
                    <p><strong>2. AuthUtils:</strong> Sử dụng utility functions để kiểm tra authentication status</p>
                    <p><strong>3. TokenManager:</strong> Tự động xử lý refresh token trong background</p>
                    <p><strong>4. API Integration:</strong> Tự động gắn token và xử lý refresh trong API calls</p>
                </div>
            </div>

            {/* Code Examples */}
            <div className="mt-8 bg-gray-900 text-white p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-4">Code Examples</h2>
                <pre className="text-sm overflow-x-auto">
                    {`// 1. Sử dụng useAuth hook
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// 2. Sử dụng utility functions
import { isAuthenticated, getCurrentUser, logout } from '../utils/authUtils';

if (isAuthenticated()) {
  const user = getCurrentUser();
  console.log('User:', user);
}

// 3. API calls tự động xử lý refresh token
import axiosInstance from '../api/axiosInstance';

const response = await axiosInstance.get('/api/v1/user/profile');
// Token sẽ được tự động refresh nếu cần`}
                </pre>
            </div>
        </div>
    );
};

export default ExampleAuthUsage;
