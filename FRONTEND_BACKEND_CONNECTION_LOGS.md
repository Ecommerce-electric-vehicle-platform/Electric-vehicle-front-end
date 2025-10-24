# 📊 Frontend-Backend Connection Logs

## 🎯 Mục đích
File này mô tả tất cả console logs để theo dõi kết nối giữa Frontend và Backend.

---

## 🚀 1. App Startup Logs

Khi app khởi động, bạn sẽ thấy:

```
🚀 =================================
🚀 [App] Starting Frontend Application
🚀 [App] Backend URL: http://localhost:8080
🚀 [App] Initializing notification service...
🚀 =================================
```

**File:** `src/App.jsx`  
**Ý nghĩa:** Frontend đang khởi động và kết nối đến Backend URL

---

## 🔌 2. WebSocket Connection Logs

### 2.1. Khi đang kết nối:
```
🔌 [WebSocket] 🔄 Connecting to backend ws://localhost:8080/ws ...
```

### 2.2. Kết nối thành công:
```
✅ [WebSocket] 🎉 Successfully connected to Backend!
📡 [WebSocket] Connection details: {
  backend: 'http://localhost:8080/ws',
  protocol: 'STOMP over SockJS',
  time: '18:30:45'
}
```

### 2.3. Subscribe vào notification topic:
```
📡 [WebSocket] Subscribing to topic: /topic/notifications/{buyerId}
✅ [WebSocket] 🎧 Successfully subscribed to notifications!
```

### 2.4. Nhận được notification từ Backend:
```
🔔 [WebSocket] 📩 New notification received from Backend!
📋 [WebSocket] Notification data: {
  id: 123,
  title: "Seller Approved",
  content: "Your seller account has been approved!",
  ...
}
```

### 2.5. Lỗi kết nối:
```
❌ [WebSocket] STOMP Error: ...
⚠️  [WebSocket] Connection closed
🔄 [WebSocket] Reconnecting... Attempt 1/5
```

### 2.6. Không kết nối (Admin hoặc chưa đăng nhập):
```
🔌 [WebSocket] ⏸️  Not connecting: No token or is admin
```

**File:** `src/services/websocketService.js`  
**Ý nghĩa:** WebSocket cho real-time notifications

---

## 📡 3. REST API Connection Logs

### 3.1. Request được gửi:
```
📤 [API] GET /api/v1/profile (authenticated)
📤 [API] POST /api/v1/auth/signin (public)
```

### 3.2. Response thành công:
```
✅ [API] GET /api/v1/profile → 200
✅ [API] POST /api/v1/auth/signin → 200
```

### 3.3. Response lỗi:
```
❌ [API] GET /api/v1/notifications → 500 Internal Server Error
❌ [API] No response from Backend for /api/v1/profile
❌ [API] Request error: Network Error
```

**File:** `src/api/axiosInstance.js`  
**Ý nghĩa:** Mọi API call đến Backend đều được log

---

## 🧪 4. Test Connection

### Scenario 1: User Login (Buyer/Seller)
```
🚀 [App] Starting Frontend Application
📤 [API] POST /api/v1/auth/signin (public)
✅ [API] POST /api/v1/auth/signin → 200
📤 [API] GET /api/v1/profile (authenticated)
✅ [API] GET /api/v1/profile → 200
🔌 [WebSocket] 🔄 Connecting to backend ws://localhost:8080/ws ...
✅ [WebSocket] 🎉 Successfully connected to Backend!
📡 [WebSocket] Subscribing to topic: /topic/notifications/123
✅ [WebSocket] 🎧 Successfully subscribed to notifications!
```

### Scenario 2: Admin Login
```
🚀 [App] Starting Frontend Application
📤 [API] POST /api/v1/admin/signin (public)
✅ [API] POST /api/v1/admin/signin → 200
🔌 [WebSocket] ⏸️  Not connecting: No token or is admin
```

### Scenario 3: Backend Offline
```
🚀 [App] Starting Frontend Application
📤 [API] GET /api/v1/profile (authenticated)
❌ [API] No response from Backend for /api/v1/profile
🔌 [WebSocket] 🔄 Connecting to backend ws://localhost:8080/ws ...
❌ [WebSocket] WebSocket Error: ...
⚠️  [WebSocket] Connection closed
🔄 [WebSocket] Reconnecting... Attempt 1/5
```

---

## 🎨 5. Log Color Guide

| Icon | Ý nghĩa | Màu trong Console |
|------|---------|-------------------|
| 🚀 | App startup | Blue |
| 🔌 | WebSocket | Blue |
| ✅ | Success | Green |
| 📤 | Request | Blue |
| 📡 | Subscribe | Blue |
| 🔔 | Notification | Yellow |
| 📋 | Data | Default |
| ⚠️  | Warning | Yellow |
| ❌ | Error | Red |
| 🔄 | Retry | Blue |

---

## 🔍 6. Troubleshooting

### ❓ Không thấy log nào?
- Mở DevTools (F12) → Console tab
- Clear console và reload trang

### ❓ Chỉ thấy API logs, không thấy WebSocket?
- Check: Đã đăng nhập bằng **buyer/seller** chưa? (Admin không dùng WebSocket)
- Check: `buyerId` có trong localStorage không?

### ❓ WebSocket cứ reconnect liên tục?
- Backend chưa chạy hoặc endpoint `/ws` sai
- Check CORS settings ở Backend

### ❓ API trả về 401 Unauthorized?
- Token hết hạn hoặc không hợp lệ
- Clear localStorage và login lại

---

## 📝 7. How to Use

1. **Mở DevTools:** F12 → Console tab
2. **Filter logs:**
   - `[WebSocket]` - Chỉ xem WebSocket logs
   - `[API]` - Chỉ xem API logs
   - `[App]` - Chỉ xem App startup logs
3. **Copy logs:** Right-click → "Save as..." để lưu logs

---

**Last Updated:** October 23, 2025  
**Status:** ✅ Fully Implemented

