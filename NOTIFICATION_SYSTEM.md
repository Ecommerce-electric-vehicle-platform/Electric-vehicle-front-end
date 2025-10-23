# 🔔 Hệ thống Thông báo Realtime

## Tổng quan

Hệ thống thông báo realtime cho phép Buyer nhận thông báo ngay lập tức khi Admin phê duyệt yêu cầu nâng cấp Seller, cùng với nhiều loại thông báo khác.

## Kiến trúc

### 1. **Backend API (Thực tế)**

Backend cung cấp các API sau:
**Đã có:**
- `GET /api/v1/notifications` - Lấy danh sách thông báo
- `PUT /api/v1/notifications/{id}/read` - Đánh dấu đã đọc một thông báo
- `POST /api/v1/notifications/new-notification` - Tạo thông báo mới

**Frontend tự implement:**
- `getUnreadCount()` - Tính từ danh sách notifications
- `markAllAsRead()` - Gọi markAsRead cho từng notification

**Chưa có (có thể thêm sau):**
- `DELETE /api/v1/notifications/{notificationId}` - Xóa thông báo

**Response format từ Backend:**
```json
{
  "notificationId": 123,
  "receiverId": 456,
  "type": "BUYER",
  "title": "Yêu cầu nâng cấp Seller đã được phê duyệt",
  "content": "Chúc mừng! Yêu cầu nâng cấp lên Seller của bạn đã được phê duyệt.",
  "sendAt": "2025-10-22T10:00:00.520Z",
  "readAt": null,
  "createdAt": "2025-10-22T10:00:00.520Z"
}
```

**Frontend transform sang:**
```json
{
  "notificationId": 123,
  "title": "Yêu cầu nâng cấp Seller đã được phê duyệt",
  "message": "Chúc mừng! Yêu cầu nâng cấp lên Seller của bạn đã được phê duyệt.",
  "type": "success", // auto-detect từ title/content
  "isRead": false, // từ readAt
  "createdAt": "2025-10-22T10:00:00.520Z"
}
```

### 2. **Frontend Components**

#### `notificationApi.js`
API client để gọi các endpoint notification từ backend.

#### `notificationService.js`
Service quản lý polling và phân phối thông báo:
- Polling mỗi 10 giây để lấy thông báo mới
- Subscribe/unsubscribe pattern để notify các components
- Tự động start/stop dựa trên auth status

#### `NotificationPopup`
Toast popup hiển thị ở góc trên phải khi có thông báo mới:
- Tự động ẩn sau 5 giây
- Click để xem chi tiết và navigate
- Có thể đóng thủ công

#### `NotificationList`
Dropdown list hiển thị tất cả thông báo:
- Hiển thị khi click vào bell icon
- Badge số thông báo chưa đọc
- Đánh dấu đã đọc khi click
- Pagination để load thêm

#### `Header.jsx`
Tích hợp notification vào header:
- Bell icon với badge count
- Subscribe vào notificationService
- Xử lý navigation khi click notification

## Luồng hoạt động

### Flow 1: Admin phê duyệt → Buyer nhận thông báo

```
1. Admin click "Phê duyệt" trong ApproveSeller
   ↓
2. Frontend gọi API: POST /api/v1/admin/approve-seller
   ↓
3. Backend xử lý:
   - Cập nhật status seller
   - TẠO NOTIFICATION cho buyer đó
   ↓
4. Buyer đang online:
   - notificationService đang polling mỗi 10s
   - Phát hiện notification mới
   - Dispatch cho listeners
   ↓
5. Header nhận notification:
   - Hiển thị NotificationPopup (toast)
   - Tăng badge count
   - Tự động ẩn sau 5s
```

### Flow 2: Buyer reload trang

```
1. Buyer reload trang
   ↓
2. App.jsx khởi tạo notificationService
   ↓
3. Header.jsx load notification count
   - Gọi API: GET /api/v1/notifications/unread-count
   - Hiển thị badge
   ↓
4. Buyer click vào bell icon
   ↓
5. NotificationList mở:
   - Gọi API: GET /api/v1/notifications
   - Hiển thị danh sách
```

### Flow 3: Click notification → Navigate

```
1. Buyer click vào notification
   ↓
2. Đánh dấu đã đọc:
   - Gọi API: PUT /api/v1/notifications/{id}/read
   - Cập nhật badge count
   ↓
3. Navigate dựa vào type:
   - type = "seller_approved" → navigate("/profile")
   - type = "order_updated" → navigate("/orders")
   - ...
   ↓
4. Đóng dropdown/popup
```

## Cấu hình

### Polling Interval
Trong `notificationService.js`:
```javascript
this.pollingDelay = 10000; // 10 giây
```

Có thể điều chỉnh để tăng/giảm tần suất polling.

### Auto-hide Duration
Trong `Header.jsx`:
```javascript
setTimeout(() => {
  setNotificationPopups((prev) =>
    prev.filter((n) => n.notificationId !== notification.notificationId)
  );
}, 5000); // 5 giây
```

## Notification Types

| Type | Màu sắc | Icon | Sử dụng cho |
|------|---------|------|------------|
| `success` | Xanh lá | ✓ | Phê duyệt thành công, thanh toán thành công |
| `error` | Đỏ | ✕ | Từ chối, lỗi |
| `info` | Xanh dương | ℹ | Thông tin chung |
| `warning` | Vàng | ⚠ | Cảnh báo |

## Testing

### 1. Test thủ công

**Cách 1: Qua Admin Dashboard**
1. Đăng nhập với tài khoản buyer và gửi yêu cầu nâng cấp seller
2. Mở tab khác, đăng nhập admin
3. Phê duyệt yêu cầu
4. Quay lại tab buyer → sẽ thấy popup notification sau tối đa 10s

**Cách 2: Mock notification**
Thêm vào console browser (khi đã login):
```javascript
// Trigger một notification giả
const mockNotification = {
  notificationId: Date.now(),
  title: "Test Notification",
  message: "This is a test notification",
  type: "success",
  isRead: false,
  createdAt: new Date().toISOString()
};

window.dispatchEvent(new CustomEvent('mockNotification', { 
  detail: mockNotification 
}));
```

### 2. Test với Backend Mock

Nếu backend chưa sẵn sàng, có thể mock API responses trong `notificationApi.js`:
```javascript
// Thêm vào đầu file
const MOCK_MODE = true;

if (MOCK_MODE) {
  return {
    data: {
      notifications: [
        {
          notificationId: "1",
          title: "Yêu cầu nâng cấp Seller đã được phê duyệt",
          message: "Vui lòng mua gói Seller để kích hoạt",
          type: "success",
          isRead: false,
          createdAt: new Date().toISOString()
        }
      ],
      meta: { totalPages: 1 }
    }
  };
}
```

## Browser Support

- Chrome ✓
- Firefox ✓
- Safari ✓
- Edge ✓

Notification sử dụng:
- `localStorage` để lưu auth tokens
- `CustomEvent` để communicate giữa components
- `setInterval` cho polling
- Portal API của React để render popup

## Performance

### Optimizations
1. **Polling chỉ khi authenticated**: Dừng polling khi user logout
2. **Debounce notifications**: Không hiển thị duplicate notifications
3. **Lazy loading**: NotificationList chỉ load khi mở dropdown
4. **Pagination**: Load 20 notifications mỗi lần

### Memory Leaks Prevention
- Cleanup listeners trong useEffect
- Clear intervals khi unmount
- Remove event listeners khi component unmount

## Future Improvements

1. **WebSocket thay vì Polling**
   - Realtime hơn
   - Tiết kiệm bandwidth
   - Giảm load cho server

2. **Push Notifications**
   - Sử dụng Service Worker
   - Notification API của browser
   - Nhận thông báo khi không mở app

3. **Notification Categories**
   - Filter theo category (orders, sellers, system)
   - Settings để bật/tắt từng loại

4. **Rich Notifications**
   - Thêm images, buttons
   - Action buttons trong notification

5. **Sound & Vibration**
   - Âm thanh khi có notification mới
   - Vibration trên mobile

## Troubleshooting

### Không nhận được notification

**Kiểm tra:**
1. User đã đăng nhập? (`localStorage.getItem("token")`)
2. authType không phải "admin"? (`localStorage.getItem("authType")`)
3. Console có log "🔔 Starting notification polling..."?
4. Network tab có request đến `/api/v1/notifications`?
5. Backend có tạo notification khi admin approve?

### Badge count không đúng

**Kiểm tra:**
1. API `/api/v1/notifications/unread-count` trả về đúng?
2. Event `notificationRead` có được dispatch?
3. Console log để xem count được update

### Popup không tự động ẩn

**Kiểm tra:**
1. setTimeout có được clear khi component unmount?
2. NotificationPopup có prop onClose?

## Auto-detect Notification Type

Frontend tự động phát hiện type (success/error/warning/info) dựa vào nội dung:

### Success Keywords
Nếu `title` hoặc `content` chứa: **phê duyệt**, **thành công**, **hoàn thành**, **chấp nhận**, **approved**, **success**, **completed**, **accepted**
→ Type = `success` (icon ✓ màu xanh lá)

### Error Keywords  
Nếu chứa: **từ chối**, **thất bại**, **lỗi**, **hủy**, **rejected**, **failed**, **error**, **cancelled**, **denied**
→ Type = `error` (icon ✕ màu đỏ)

### Warning Keywords
Nếu chứa: **cảnh báo**, **chú ý**, **lưu ý**, **warning**, **attention**, **notice**, **pending**
→ Type = `warning` (icon ⚠ màu vàng)

### Default
Còn lại → Type = `info` (icon ℹ màu xanh dương)

## API Contract (Backend thực tế)

### GET /api/v1/notifications

**Query params:**
- `page` (int, optional): Page number (0-indexed)
- `size` (int, optional): Items per page

**Response:** Array of notifications
```json
[
  {
    "notificationId": 123,
    "receiverId": 456,
    "type": "BUYER",
    "title": "string",
    "content": "string",
    "sendAt": "2025-10-22T10:00:00.520Z",
    "readAt": "2025-10-22T10:00:00.520Z" | null,
    "createdAt": "2025-10-22T10:00:00.520Z"
  }
]
```

### PUT /api/v1/notifications/{id}/read

**Path params:**
- `id` (integer): notification ID

**Response:**
```json
{
  "message": "OK"
}
```

### POST /api/v1/notifications/new-notification

**Request body:**
```json
{
  "notificationId": 0,
  "receiverId": 456,
  "type": "BUYER",
  "title": "string",
  "content": "string",
  "sendAt": "2025-10-22T10:00:00.520Z",
  "readAt": "2025-10-22T10:00:00.520Z",
  "createdAt": "2025-10-22T10:00:00.520Z"
}
```

**Response:**
```json
{
  "notificationId": 123,
  ...
}
```

## Liên hệ

Nếu có vấn đề với hệ thống notification, vui lòng liên hệ team development.

