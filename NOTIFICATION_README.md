# 🔔 Notification System - Quick Start

**Status:** ✅ Đã fix xong - Ready to test!

---

## 🚀 **TEST NGAY** (3 bước)

### **Bước 1: Reload Page**
```
Ctrl + F5 (hoặc Cmd + Shift + R trên Mac)
```

### **Bước 2: Mở Console**
```
F12 → Tab "Console"
```

### **Bước 3: Click Chuông**
```
Click vào icon 🔔 trên header
```

**Expected Result:**
- ✅ Dropdown hiển thị notifications
- ✅ Thấy notification "Phê duyệt thành công"
- ✅ Icon màu xanh (success)

---

## 🧪 **DEBUG (Nếu không hiển thị)**

### **Option 1: Test Script (Khuyến nghị)**

1. Mở Console (F12)
2. Mở file: `TEST_NOTIFICATION_CONSOLE.js`
3. Copy toàn bộ code
4. Paste vào Console → Enter
5. Đọc kết quả

**Script sẽ check:**
- ✅ Token có hợp lệ không
- ✅ Backend API có hoạt động không
- ✅ Response format đúng chưa
- ✅ Transform data OK chưa

---

### **Option 2: Manual Check**

**Check 1: Backend API**
```bash
# Console (F12)
fetch('http://localhost:8080/api/v1/notifications', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('accessToken') }
})
.then(r => r.json())
.then(d => console.table(d));
```

**Expected:** Array of notifications
```
┌─────┬────────────────┬────────────────────────────┬─────────────────────┐
│ idx │ notificationId │ title                      │ content             │
├─────┼────────────────┼────────────────────────────┼─────────────────────┤
│ 0   │ 1              │ UPGRADE ACCOUNT INFO...    │ Phê duyệt thành...  │
└─────┴────────────────┴────────────────────────────┴─────────────────────┘
```

**Check 2: Console Logs**

Click chuông → Check Console có logs này không:
```
[API] Calling GET /api/v1/notifications { page: 0, size: 20 }
[API] Raw response from backend: (1) [Object]
[API] Transformed notification: { notificationId: 1, ... }
[API] Final result: { data: { notifications: [...] } }
```

**Check 3: Network Tab**

1. Mở Network tab
2. Click chuông
3. Tìm request: `notifications?page=0&size=20`
4. Check Status Code: Phải là **200 OK**
5. Check Response: Phải là array notifications

---

## ❌ **COMMON ISSUES**

### **Issue 1: Dropdown empty "Bạn chưa có thông báo nào"**

**Nguyên nhân:** Backend chưa có notification hoặc API lỗi

**Fix:**
1. Check Console logs → Tìm "[API] Raw response"
2. Nếu thấy `[]` → Backend chưa có notification, cần:
   - Admin approve seller KYC
   - Hoặc tạo notification test
3. Nếu thấy `404` → Backend chưa implement API
4. Nếu thấy `401` → Token hết hạn, đăng nhập lại

---

### **Issue 2: Badge không hiển thị số**

**Nguyên nhân:** `getUnreadCount()` API lỗi

**Fix:**
```javascript
// Console
notificationApi.getUnreadCount().then(r => console.log(r));

// Expected: { data: { unreadCount: 1 } }
```

---

### **Issue 3: Click notification không mark as read**

**Nguyên nhân:** `markAsRead()` API lỗi

**Check:** Network tab → Tìm request `PUT /notifications/1/read`

---

## 📄 **FILES ĐÃ TẠO**

| File | Mục đích |
|------|----------|
| `NOTIFICATION_FIX_SUMMARY.md` | ✅ Chi tiết các fix đã làm |
| `NOTIFICATION_SYSTEM_GUIDE.md` | 📚 Hướng dẫn chi tiết hệ thống |
| `TEST_NOTIFICATION_CONSOLE.js` | 🧪 Script test nhanh |
| `NOTIFICATION_README.md` | 📖 File này (Quick start) |

---

## 🎯 **EXPECTED BEHAVIOR**

### **1. Badge Number**
```
Header: 🔔 [1]  ← Số notification chưa đọc
```

### **2. Dropdown**
Click chuông → Hiển thị:
```
┌───────────────────────────────────────┐
│ Thông báo     [Đánh dấu tất cả đã đọc]│
├───────────────────────────────────────┤
│ ✓ UPGRADE ACCOUNT INFORMATION RESULT  │
│   Phê duyệt thành công                │
│   Vừa xong                            │
└───────────────────────────────────────┘
```

### **3. Click Notification**
- ✅ Notification chuyển từ màu xanh → trắng
- ✅ Badge số giảm: [1] → [0]
- ✅ Navigate: /profile
- ✅ Dropdown đóng

### **4. Realtime**
Admin approve → Seller nhận notification popup ngay lập tức

---

## 📞 **CẦN HỖ TRỢ?**

Nếu vẫn không hoạt động, gửi cho tôi:

1. **Screenshot Console logs** (sau khi click chuông)
2. **Screenshot Network tab** (request notifications)
3. **Screenshot dropdown** (có hiển thị gì không)

---

## ✅ **CHECKLIST**

- [ ] Đã reload page (Ctrl + F5)
- [ ] Đã click chuông 🔔
- [ ] Đã check Console logs
- [ ] Đã check Network tab
- [ ] Đã test click notification
- [ ] Đã test "Đánh dấu tất cả đã đọc"

---

**Good luck! 🚀**

