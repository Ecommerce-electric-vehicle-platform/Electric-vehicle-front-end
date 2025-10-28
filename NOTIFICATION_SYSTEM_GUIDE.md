# 🔔 Notification System - Hướng dẫn Debug & Fix

**Ngày:** 28/10/2025  
**Vấn đề:** Có notification từ backend nhưng không hiển thị trong UI  
**Trạng thái:** ✅ Đã fix endpoint API

---

## 🐛 **VẤN ĐỀ ĐÃ FIX**

### **Bug 1: Sai endpoint API** ✅ FIXED

**File:** `src/api/notificationApi.js`

**Trước:**
```javascript
const res = await axiosInstance.get("/", {  // ❌ SAI: Gọi root endpoint
  params: { page, size },
});
```

**Sau:**
```javascript
const res = await axiosInstance.get("/api/v1/notifications", {  // ✅ ĐÚNG
  params: { page, size },
});
```

---

## 📊 **BACKEND RESPONSE FORMAT**

Từ screenshot bạn cung cấp, backend trả về:

```json
[
  {
    "notificationId": 1,
    "receiverId": 123,
    "type": "SELLER",
    "title": "UPGRADE ACCOUNT INFORMATION RESULT",
    "content": "Phê duyệt thành công",
    "sendAt": "2025-10-28T17:17:22.134412",
    "readAt": null,
    "createdAt": "2025-10-28T17:17:22.134407"
  }
]
```

### **Mapping đã được xử lý:**

| Backend Field | Frontend Field | Logic |
|--------------|---------------|-------|
| `content` | `message` | Đổi tên field |
| `readAt` | `isRead` | Convert: `!!readAt` |
| `type` (SELLER) | `type` (success/error/warning) | Auto-detect từ title/content |

---

## 🔄 **LUỒNG HOẠT ĐỘNG**

### **1. Load Notification Count (Badge)**

```javascript
// Header.jsx - useEffect
const loadNotificationCount = async () => {
  const response = await notificationApi.getUnreadCount();
  setNotificationCount(response?.data?.unreadCount || 0);
};
```

**API:** `GET /api/v1/notifications`  
**Xử lý:** Đếm số notification có `readAt === null`

---

### **2. Click vào chuông 🔔**

```javascript
// Header.jsx - handleIconClick
case "bell":
  setShowNotificationDropdown(prev => !prev);
  break;
```

**Kết quả:** Hiển thị `<NotificationList />` dropdown

---

### **3. Load Notification List**

```javascript
// NotificationList.jsx - useEffect
useEffect(() => {
  if (isOpen) {
    loadNotifications(0);
  }
}, [isOpen]);
```

**API:** `GET /api/v1/notifications?page=0&size=20`  
**Transform:** Backend format → Frontend format

---

### **4. Click vào notification**

```javascript
// NotificationList.jsx - handleNotificationClick
const handleNotificationClick = async (notification) => {
  // 1. Đánh dấu đã đọc
  if (!notification.isRead) {
    await notificationApi.markAsRead(notification.notificationId);
  }
  
  // 2. Dispatch event để update badge
  window.dispatchEvent(new CustomEvent("notificationRead"));
  
  // 3. Navigate đến trang phù hợp
  onNotificationClick(notification);
  
  // 4. Đóng dropdown
  onClose();
};
```

**API:** `PUT /api/v1/notifications/{notificationId}/read`

---

## 🧪 **TEST CASES**

### **Test 1: Kiểm tra có notification từ backend**

**Bước:**
1. Mở Console (F12)
2. Click vào chuông 🔔
3. Check Console logs

**Expected logs:**
```
[API] Calling GET /api/v1/notifications { page: 0, size: 20 }
[API] Raw response from backend: [Array of notifications]
[API] Parsed notifications array: [...]
[API] Transformed notification: { ... }
[API] Final result: { data: { notifications: [...], meta: {...} } }
```

**Nếu thấy lỗi 404/500:**
- ❌ Backend API chưa hoạt động
- Check network tab để xem exact error

---

### **Test 2: Kiểm tra notification hiển thị đúng**

**Expected UI:**

✅ **Có notification:**
```
┌─────────────────────────────────┐
│ Thông báo    [Đánh dấu tất cả]  │
├─────────────────────────────────┤
│ ✓ UPGRADE ACCOUNT INFORMATION   │
│   RESULT                        │
│   Phê duyệt thành công          │
│   Vừa xong                      │
├─────────────────────────────────┤
│          [Xem thêm]             │
└─────────────────────────────────┘
```

❌ **Không có notification:**
```
┌─────────────────────────────────┐
│ Thông báo                       │
├─────────────────────────────────┤
│         🔔                      │
│  Bạn chưa có thông báo nào      │
└─────────────────────────────────┘
```

---

### **Test 3: Click notification**

**Bước:**
1. Click vào 1 notification
2. Check Console

**Expected:**
```
[API] Marking notification 1 as read
[Event] notificationRead dispatched
[Navigate] Redirecting to /profile
```

**Expected result:**
- ✅ Notification chuyển từ màu xanh (unread) → màu trắng (read)
- ✅ Badge số giảm đi 1
- ✅ Dropdown đóng lại
- ✅ Navigate đến trang tương ứng

---

### **Test 4: Đánh dấu tất cả đã đọc**

**Bước:**
1. Click "Đánh dấu tất cả đã đọc"
2. Check network tab

**Expected:**
- ✅ Gọi API: `PUT /api/v1/notifications/{id}/read` cho từng notification chưa đọc
- ✅ Badge về 0
- ✅ Tất cả notification chuyển sang màu trắng

---

## 🔍 **DEBUG CHECKLIST**

### **Nếu không thấy notification:**

- [ ] **Check 1: Backend API response**
  ```bash
  # Test bằng curl/Postman
  GET http://localhost:8080/api/v1/notifications
  Headers: Authorization: Bearer <token>
  ```
  
  **Expected:** Array of notifications
  ```json
  [
    {
      "notificationId": 1,
      "title": "...",
      "content": "...",
      "readAt": null,
      ...
    }
  ]
  ```

- [ ] **Check 2: Console logs**
  ```
  Mở Console → Reload page → Click chuông
  Tìm: "[API] Raw response from backend:"
  ```
  
  **Nếu thấy:**
  - `[]` (empty array) → Backend chưa có notification nào
  - `404 Not Found` → Endpoint sai hoặc backend chưa implement
  - `401 Unauthorized` → Token không hợp lệ

- [ ] **Check 3: Token có hợp lệ không**
  ```javascript
  // Console
  localStorage.getItem("token")
  localStorage.getItem("accessToken")
  ```
  
  **Nếu null:** Đăng nhập lại

- [ ] **Check 4: Badge có hiển thị số không**
  ```
  Reload page → Check chuông có badge màu đỏ với số không
  ```
  
  **Nếu có badge nhưng dropdown empty:**
  - Backend có notification
  - Frontend parsing bị lỗi → Check Console logs

---

## 🎨 **NOTIFICATION TYPES**

Frontend tự động detect type từ title/content:

| Type | Icon | Color | Keywords |
|------|------|-------|----------|
| **success** | ✓ CheckCircle | Green | "phê duyệt", "thành công", "approved", "success" |
| **error** | ✕ AlertCircle | Red | "từ chối", "thất bại", "rejected", "failed" |
| **warning** | ⚠ AlertTriangle | Yellow | "cảnh báo", "pending", "warning" |
| **info** | ℹ Info | Blue | (default) |

**Example:**
```
Title: "UPGRADE ACCOUNT INFORMATION RESULT"
Content: "Phê duyệt thành công"

→ Detect: "phê duyệt" + "thành công" 
→ Type: success ✓ (màu xanh)
```

---

## 📝 **API ENDPOINTS**

| Endpoint | Method | Params | Response |
|----------|--------|--------|----------|
| `/api/v1/notifications` | GET | `page`, `size` | Array of notifications |
| `/api/v1/notifications/{id}/read` | PUT | - | Success message |
| `/api/v1/notifications/new-notification` | POST | Notification object | Created notification |

---

## 🚀 **TESTING STEPS**

### **Bước 1: Test Backend API trực tiếp**

```bash
# Option 1: curl
curl -X GET "http://localhost:8080/api/v1/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Option 2: Postman
GET http://localhost:8080/api/v1/notifications
Headers:
  Authorization: Bearer YOUR_TOKEN
```

**Expected Response:**
```json
[
  {
    "notificationId": 1,
    "receiverId": 123,
    "type": "SELLER",
    "title": "UPGRADE ACCOUNT INFORMATION RESULT",
    "content": "Phê duyệt thành công",
    "sendAt": "2025-10-28T17:17:22.134412",
    "readAt": null,
    "createdAt": "2025-10-28T17:17:22.134407"
  }
]
```

---

### **Bước 2: Test Frontend**

1. ✅ Đăng nhập vào app
2. ✅ Reload page (Ctrl + F5)
3. ✅ Check badge trên chuông (phải có số)
4. ✅ Click vào chuông 🔔
5. ✅ Xem dropdown notification list

**Nếu không hiển thị:**
- Mở Console (F12)
- Check logs `[API] Raw response from backend:`
- Nếu thấy array notifications → Frontend parsing OK
- Nếu thấy `[]` → Backend chưa có data
- Nếu thấy error → Check error message

---

### **Bước 3: Test Click Notification**

1. ✅ Click vào 1 notification trong list
2. ✅ Check notification chuyển từ màu xanh → trắng
3. ✅ Check badge số giảm đi 1
4. ✅ Check navigate đến trang đúng

---

### **Bước 4: Test Mark All as Read**

1. ✅ Click "Đánh dấu tất cả đã đọc"
2. ✅ Check tất cả notification chuyển màu
3. ✅ Check badge về 0
4. ✅ Check network tab có nhiều request `PUT /notifications/{id}/read`

---

## 💡 **TIPS**

### **Xem notification data trong Console:**

```javascript
// Console DevTools
notificationApi.getNotifications(0, 20).then(res => {
  console.table(res.data.notifications);
});
```

### **Xem unread count:**

```javascript
notificationApi.getUnreadCount().then(res => {
  console.log("Unread count:", res.data.unreadCount);
});
```

### **Simulate notification (Test realtime):**

```javascript
// Console DevTools
const testNotif = {
  notificationId: 999,
  title: "Test Notification",
  message: "This is a test",
  type: "success",
  isRead: false,
  createdAt: new Date().toISOString()
};

// Dispatch event (giống như WebSocket nhận được)
window.dispatchEvent(new CustomEvent("newNotification", { detail: testNotif }));
```

---

## 🔗 **FILES LIÊN QUAN**

| File | Chức năng |
|------|-----------|
| `src/components/Header/Header.jsx` | Hiển thị badge, toggle dropdown |
| `src/components/NotificationList/NotificationList.jsx` | Dropdown list notifications |
| `src/api/notificationApi.js` | API calls & data transformation |
| `src/services/notificationService.js` | WebSocket realtime notifications |

---

## 📞 **FAQ**

### **Q: Tại sao badge hiển thị số nhưng dropdown empty?**

**A:** 2 khả năng:
1. Backend response format sai → Check Console logs
2. Frontend parsing lỗi → Check `notificationApi.js` line 19-40

---

### **Q: Click notification nhưng không đóng dropdown?**

**A:** Check xem có lỗi trong Console không. Có thể API `markAsRead` bị lỗi.

---

### **Q: Notification type luôn hiển thị icon Info (ℹ)?**

**A:** Backend không trả về `type` field, frontend auto-detect từ title/content. Check function `detectNotificationType()` trong `notificationApi.js`.

---

### **Q: Làm sao để test realtime notification?**

**A:** 
1. Mở 2 browser/tab
2. Tab 1: Đăng nhập seller
3. Tab 2: Đăng nhập admin → Approve seller KYC
4. Tab 1: Phải nhận notification realtime (popup + badge update)

---

## ✅ **EXPECTED RESULT**

Sau khi fix:

1. ✅ Badge trên chuông hiển thị số notification chưa đọc
2. ✅ Click chuông → Dropdown hiển thị danh sách notifications
3. ✅ Notification có icon, title, message, time đúng
4. ✅ Click notification → Đánh dấu đã đọc + Navigate + Badge giảm
5. ✅ "Đánh dấu tất cả" → Tất cả notification → đã đọc + Badge về 0
6. ✅ Realtime: Admin approve → Seller nhận notification ngay lập tức

---

**Đã fix endpoint API. Giờ test lại bằng cách:**
1. Reload page (Ctrl + F5)
2. Click vào chuông 🔔
3. Check Console logs

**Nếu vẫn không hiển thị, gửi screenshot Console logs để debug tiếp!** 🚀

