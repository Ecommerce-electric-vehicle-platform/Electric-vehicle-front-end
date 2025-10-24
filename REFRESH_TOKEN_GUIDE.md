# Hướng dẫn sử dụng Refresh Token System

## Tổng quan

Hệ thống refresh token đã được tích hợp vào ứng dụng để tự động xử lý việc làm mới access token khi hết hạn, đảm bảo trải nghiệm người dùng mượt mà mà không cần đăng nhập lại.

## Các thành phần chính

### 1. TokenManager (`src/utils/tokenManager.js`)
- Quản lý việc lưu trữ và làm mới tokens
- Tự động refresh token khi access token hết hạn
- Xử lý queue các request đang chờ khi refresh token
- Kiểm tra token hết hạn dựa trên JWT payload

### 2. AuthUtils (`src/utils/authUtils.js`)
- Utility functions để quản lý authentication
- Các hàm helper để kiểm tra trạng thái đăng nhập
- Quản lý thông tin user và tokens

### 3. useAuth Hook (`src/hooks/useAuth.js`)
- React hook để quản lý authentication state
- Tự động kiểm tra và refresh token
- Cung cấp các methods để login, logout, kiểm tra role

### 4. API Integration
- `axiosInstance.js`: Tích hợp refresh token cho user API
- `adminAxios.js`: Tích hợp refresh token cho admin API
- `authApi.js`: Tự động lưu tokens sau khi đăng nhập

## Cách sử dụng

### 1. Trong React Components

```jsx
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

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
```

### 2. Sử dụng AuthUtils

```javascript
import { 
  isAuthenticated, 
  getCurrentUser, 
  logout,
  hasRefreshToken 
} from '../utils/authUtils';

// Kiểm tra đăng nhập
if (isAuthenticated()) {
  const user = getCurrentUser();
  console.log('User:', user);
}

// Kiểm tra có refresh token không
if (hasRefreshToken()) {
  console.log('User has refresh token');
}

// Logout
logout();
```

### 3. Sử dụng TokenManager trực tiếp

```javascript
import tokenManager from '../utils/tokenManager';

// Lấy token hợp lệ (tự động refresh nếu cần)
try {
  const validToken = await tokenManager.getValidToken();
  console.log('Valid token:', validToken);
} catch (error) {
  console.error('Failed to get valid token:', error);
}

// Kiểm tra token hết hạn
const isExpired = tokenManager.isTokenExpired(token);
```

## Luồng hoạt động

### 1. Đăng nhập
1. User đăng nhập qua `authApi.signin()`
2. API trả về `accessToken` và `refreshToken`
3. `saveAuthData()` tự động lưu tokens và user info
4. `useAuth` hook cập nhật state

### 2. API Request
1. Mỗi request qua `axiosInstance` hoặc `adminAxios`
2. Request interceptor tự động gắn token hợp lệ
3. Nếu token hết hạn, `tokenManager` tự động refresh
4. Request được retry với token mới

### 3. Token Refresh
1. Khi nhận lỗi 401, response interceptor được kích hoạt
2. `tokenManager.refreshAccessToken()` được gọi
3. Nếu refresh thành công, request được retry
4. Nếu refresh thất bại, user được redirect về login

### 4. Logout
1. `logout()` được gọi
2. Tất cả tokens và user data được xóa
3. User được redirect về trang chủ

## Cấu hình

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:8080
```

### API Endpoints
- `POST /api/v1/auth/refresh-token`: Refresh token endpoint
- Các endpoint khác sử dụng Bearer token authentication

## Xử lý lỗi

### 1. Token hết hạn
- Tự động refresh token
- Retry request với token mới
- Nếu refresh thất bại, redirect về login

### 2. Refresh token hết hạn
- Xóa tất cả tokens
- Redirect về login page
- Hiển thị thông báo đăng nhập lại

### 3. Network errors
- Retry logic cho refresh token
- Fallback về manual login nếu cần

## Best Practices

### 1. Sử dụng useAuth hook
```jsx
// ✅ Good
const { user, isAuthenticated } = useAuth();

// ❌ Avoid
const token = localStorage.getItem('accessToken');
```

### 2. Kiểm tra authentication
```jsx
// ✅ Good
if (isAuthenticated) {
  // Render protected content
}

// ❌ Avoid
if (localStorage.getItem('accessToken')) {
  // Render content
}
```

### 3. Logout handling
```jsx
// ✅ Good
const { logout } = useAuth();
<button onClick={logout}>Logout</button>

// ❌ Avoid
<button onClick={() => localStorage.clear()}>Logout</button>
```

## Troubleshooting

### 1. Token không được refresh
- Kiểm tra refresh token có tồn tại không
- Kiểm tra API endpoint `/api/v1/auth/refresh-token`
- Kiểm tra network connection

### 2. Infinite refresh loop
- Kiểm tra logic trong response interceptor
- Đảm bảo `_retry` flag được set đúng
- Kiểm tra refresh token endpoint không yêu cầu authentication

### 3. User bị logout không mong muốn
- Kiểm tra refresh token có hết hạn không
- Kiểm tra server response format
- Kiểm tra error handling trong tokenManager

## Monitoring

### Console Logs
- Token refresh attempts
- Authentication status changes
- Error messages với context

### Network Tab
- Refresh token requests
- Retry requests sau khi refresh
- Error responses

Hệ thống refresh token này đảm bảo trải nghiệm người dùng mượt mà và bảo mật cao cho ứng dụng.
