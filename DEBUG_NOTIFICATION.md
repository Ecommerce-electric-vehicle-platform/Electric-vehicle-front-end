# Debug Notification Not Showing

## Vấn đề
Notification đã lưu vào DB nhưng user không thấy hiển thị.

## Các bước debug

### 1. Kiểm tra Console Log

Mở **DevTools > Console** (F12), tìm các log sau:

```
Cần thấy:
🔔 Initializing notification service...
🔔 Starting notification polling...

❌ Nếu không thấy → Polling chưa start
```

### 2. Kiểm tra Network Tab

Mở **DevTools > Network** tab:

```
✅ Cần thấy:
Request: GET /api/v1/notifications
Mỗi 10 giây có 1 request

❌ Nếu không thấy → API không được gọi
```

### 3. Kiểm tra API Response

Click vào request `GET /api/v1/notifications`, xem **Response**:

**Nếu response = `[]` (empty array):**
- ✅ Notification chưa có cho user này
- ❓ Kiểm tra `receiverId` trong DB có đúng với `buyerId` đang login không?

**Nếu response có data:**
```json
[
  {
    "notificationId": 123,
    "receiverId": 456,
    "type": "BUYER",
    "title": "...",
    "content": "...",
    "readAt": null,
    "createdAt": "..."
  }
]
```
- ✅ Có data → Kiểm tra transform có đúng không

### 4. Kiểm tra receiverId vs buyerId

**Trong Console, chạy:**
```javascript
// Lấy buyerId đang login
console.log("buyerId:", localStorage.getItem("buyerId"));

// Gọi API notification
fetch('http://localhost:5173/api/v1/notifications', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => {
  console.log("Notifications:", data);
  if (data.length > 0) {
    console.log("receiverId in notification:", data[0].receiverId);
  }
});
```

**So sánh:**
- `buyerId` (đang login) phải **BẰNG** `receiverId` (trong notification)
- Nếu khác → Backend tạo notification với sai receiverId

## Các lỗi thường gặp

### Lỗi 1: receiverId không khớp

**Nguyên nhân:** Backend tạo notification với `receiverId` khác với `buyerId` đang login

**Fix:**
```java
// Backend - Khi tạo notification
Seller seller = sellerRepository.findById(sellerId);
Long buyerId = seller.getBuyerId(); // ⭐ Lấy đúng buyerId

notification.setReceiverId(buyerId); // ⭐ Set đúng receiverId
```

### Lỗi 2: Polling chưa start

**Nguyên nhân:** `notificationService.init()` chưa được gọi

**Fix:** Kiểm tra trong `App.jsx`:
```javascript
useEffect(() => {
  console.log("🔔 Initializing notification service...");
  notificationService.init();
}, []);
```

### Lỗi 3: Token hết hạn

**Nguyên nhân:** API trả về 401

**Fix:** Login lại

### Lỗi 4: authType = "admin"

**Nguyên nhân:** Đang login bằng admin account

**Fix:** Polling chỉ chạy cho user (buyer), không chạy cho admin

### Lỗi 5: Backend chưa enable CORS

**Nguyên nhân:** Request bị block bởi CORS

**Fix Backend:**
```java
@CrossOrigin(origins = "http://localhost:5173")
```

## Test thủ công

### Test 1: Tạo notification trực tiếp

**Postman:**
```bash
POST http://localhost:8080/api/v1/notifications/new-notification
Content-Type: application/json

{
  "notificationId": 0,
  "receiverId": YOUR_BUYER_ID,  // ⭐ Thay bằng buyerId thật
  "type": "BUYER",
  "title": "TEST - Phê duyệt thành công",
  "content": "Đây là test notification",
  "sendAt": "2025-10-22T10:00:00Z",
  "readAt": null,
  "createdAt": "2025-10-22T10:00:00Z"
}
```

**Kiểm tra:**
1. Response 200 OK?
2. Vào DB check notification có tồn tại?
3. `receiverId` đúng?

### Test 2: Check API từ frontend

**Console:**
```javascript
// Check auth
console.log("token:", localStorage.getItem("token"));
console.log("buyerId:", localStorage.getItem("buyerId"));
console.log("authType:", localStorage.getItem("authType"));

// Manual call API
fetch('http://localhost:5173/api/v1/notifications', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(data => console.log("API Response:", data));
```

## Quick Fix Checklist

- [ ] Console có log "🔔 Initializing notification service..."?
- [ ] Console có log "🔔 Starting notification polling..."?
- [ ] Network tab có request GET /api/v1/notifications mỗi 10s?
- [ ] API response có data?
- [ ] `receiverId` trong notification = `buyerId` đang login?
- [ ] Token chưa hết hạn?
- [ ] authType !== "admin"?
- [ ] Backend đã enable CORS?

## Nếu vẫn không được

### Debug với breakpoint

**Trong `notificationService.js`, thêm log:**

```javascript
async pollNotifications() {
  console.log("📡 Polling notifications...");
  
  try {
    const token = localStorage.getItem("token");
    const authType = localStorage.getItem("authType");
    
    console.log("Token:", token ? "✅ Có" : "❌ Không");
    console.log("AuthType:", authType);
    
    if (!token || authType === "admin") {
      console.log("⛔ Stopped: No token or is admin");
      return;
    }

    const response = await notificationApi.getNotifications(0, 5);
    console.log("📥 API Response:", response);
    
    const notifications = response?.data?.notifications || [];
    console.log("🔔 Notifications count:", notifications.length);
    
    if (notifications.length > 0) {
      console.log("📬 Latest notification:", notifications[0]);
      
      const latestNotification = notifications[0];
      
      if (
        latestNotification.notificationId !== this.lastNotificationId &&
        !latestNotification.isRead
      ) {
        console.log("🎉 NEW NOTIFICATION! Showing popup...");
        this.notify(latestNotification);
        this.lastNotificationId = latestNotification.notificationId;
      } else {
        console.log("ℹ️ No new notification (already seen or read)");
      }
    } else {
      console.log("📭 No notifications");
    }
  } catch (error) {
    console.error("❌ Polling error:", error);
  }
}
```

### Rebuild & Clear Cache

```bash
# Stop dev server
# Clear browser cache
# Clear localStorage
localStorage.clear();

# Restart dev server
npm run dev

# Login lại
```

## Expected Flow

```
1. User login → Set token, buyerId
   ↓
2. App.jsx → notificationService.init()
   ↓
3. notificationService → startPolling()
   ↓
4. Mỗi 10s → pollNotifications()
   ↓
5. GET /api/v1/notifications
   ↓
6. Transform response
   ↓
7. Check có notification mới không?
   ↓
8. Có → Show popup + Update badge
```

## Contact

Nếu vẫn không được sau khi làm hết các bước trên, gửi cho tôi:
1. Screenshot Console log
2. Screenshot Network tab (request & response)
3. Screenshot DB record (notification)
4. buyerId đang login

