# ✅ Tích hợp Backend API - Summary

## Đã cập nhật

### 1. `src/api/notificationApi.js` ✅

**Thay đổi chính:**

- ✅ Cập nhật `GET /api/v1/notifications` để match với backend response
- ✅ Transform backend format (`content`, `readAt`) sang frontend format (`message`, `isRead`)
- ✅ Auto-detect notification type từ title/content
- ✅ Implement `getUnreadCount()` bằng cách tính từ danh sách
- ✅ Implement `markAllAsRead()` bằng cách gọi API cho từng notification
- ✅ Thêm `createNotification()` để admin/system tạo notification

**Mapping Backend → Frontend:**

```javascript
Backend:                    Frontend:
{                          {
  notificationId: 123       notificationId: 123
  receiverId: 456           (không dùng ở UI)
  type: "BUYER"             type: "success" (auto-detect)
  title: "..."              title: "..."
  content: "..."            message: "..."
  readAt: null              isRead: false
  sendAt: "..."             (không dùng)
  createdAt: "..."          createdAt: "..."
}                          }
```

### 2. Auto-detect Type Logic ✅

**Implemented function:** `detectNotificationType(title, content)`

| Từ khóa | Type | Icon |
|---------|------|------|
| phê duyệt, thành công, approved, success | success | ✓ |
| từ chối, thất bại, rejected, failed | error | ✕ |
| cảnh báo, warning, pending | warning | ⚠ |
| Còn lại | info | ℹ |

### 3. Documentation ✅

- ✅ `NOTIFICATION_SYSTEM.md` - Cập nhật với API thực tế
- ✅ `BACKEND_INTEGRATION_GUIDE.md` - Hướng dẫn cho Backend Developer

## Backend cần làm gì?

### Khi Admin approve Seller:

```java
// Trong hàm approveSeller()
public void approveSeller(Long sellerId, String decision) {
    // 1. Update seller status
    seller.setStatus("APPROVED");
    sellerRepository.save(seller);
    
    // 2. ⭐ TẠO NOTIFICATION
    createNotification(
        seller.getBuyerId(),  // receiverId
        "Yêu cầu nâng cấp Seller đã được phê duyệt ✅",  // title
        "Chúc mừng! Yêu cầu nâng cấp lên Seller của bạn đã được phê duyệt. Vui lòng mua gói Seller để kích hoạt."  // content
    );
}
```

### Tạo notification helper:

```java
private void createNotification(Long receiverId, String title, String content) {
    Notification notification = new Notification();
    notification.setReceiverId(receiverId);
    notification.setType("BUYER");
    notification.setTitle(title);
    notification.setContent(content);
    notification.setSendAt(LocalDateTime.now());
    notification.setReadAt(null);  // Chưa đọc
    notification.setCreatedAt(LocalDateTime.now());
    
    notificationRepository.save(notification);
}
```

## Testing Flow

### 1. Test thủ công với Postman

**Tạo notification:**
```bash
POST http://localhost:8080/api/v1/notifications/new-notification
Content-Type: application/json

{
  "notificationId": 0,
  "receiverId": 123,  // Buyer ID của bạn
  "type": "BUYER",
  "title": "Test - Phê duyệt thành công",
  "content": "Đây là test notification",
  "sendAt": "2025-10-22T10:00:00Z",
  "readAt": null,
  "createdAt": "2025-10-22T10:00:00Z"
}
```

**Kiểm tra:**
1. Login frontend với buyer account (ID = 123)
2. Đợi tối đa 10 giây
3. → Popup sẽ hiển thị ở góc phải màn hình

### 2. Test với approval flow thực tế

1. Buyer gửi yêu cầu nâng cấp seller
2. Admin login vào dashboard
3. Admin approve seller
4. Backend tạo notification
5. Buyer nhận popup realtime (trong vòng 10s)
6. Click vào notification → navigate đến `/profile`
7. Badge count giảm đi 1

## Checklist cho Backend

- [ ] Implement `createNotification()` helper function
- [ ] Gọi `createNotification()` sau khi approve seller thành công
- [ ] Gọi `createNotification()` sau khi reject seller (với title/content khác)
- [ ] Set đúng `receiverId` = `seller.getBuyerId()`
- [ ] Set `readAt = null` cho notification mới
- [ ] Test với Postman trước
- [ ] Test với frontend sau

## Các API endpoints hiện tại

| Method | Endpoint | Status | Dùng cho |
|--------|----------|--------|----------|
| GET | `/api/v1/notifications` | ✅ Có | Lấy danh sách |
| PUT | `/api/v1/notifications/{id}/read` | ✅ Có | Đánh dấu đã đọc |
| POST | `/api/v1/notifications/new-notification` | ✅ Có | Tạo mới |
| GET | `/api/v1/notifications/unread-count` | ⚠️ Frontend tự tính | Lấy count |
| PUT | `/api/v1/notifications/read-all` | ⚠️ Frontend gọi multiple | Đánh dấu tất cả |
| DELETE | `/api/v1/notifications/{id}` | ❌ Chưa có | Xóa notification |

## Expected Results

### Khi Admin approve seller:

1. ✅ Backend tạo notification với `receiverId` = buyer ID
2. ✅ Buyer đang online → Nhận popup trong 10s
3. ✅ Badge count tăng lên
4. ✅ Click notification → Navigate đến `/profile`
5. ✅ Notification được đánh dấu đã đọc
6. ✅ Badge count giảm đi

### Khi Buyer reload trang:

1. ✅ Header load notification count
2. ✅ Badge hiển thị số thông báo chưa đọc
3. ✅ Click bell icon → Dropdown hiển thị danh sách
4. ✅ Notification chưa đọc có dấu chấm xanh
5. ✅ Click notification → Đánh dấu đã đọc + Navigate

## Screenshots Expected

### Popup Toast (Realtime)
```
┌─────────────────────────────────────┐
│ ✓  Yêu cầu nâng cấp Seller đã được  │
│    phê duyệt                         │
│                                      │
│    Chúc mừng! Yêu cầu nâng cấp...   │
│    Vừa xong                     [×] │
└─────────────────────────────────────┘
```

### Bell Icon với Badge
```
🔔 [4]  ← Badge màu đỏ với số 4
```

### Dropdown List
```
┌─────────────────────────────────────┐
│ Thông báo    [Đánh dấu tất cả đã đọc]│
├─────────────────────────────────────┤
│ ● ✓ Yêu cầu nâng cấp Seller đã...  │ ← Chưa đọc
│     Chúc mừng! Yêu cầu...           │
│     2 phút trước                     │
├─────────────────────────────────────┤
│   ℹ Đơn hàng #123 đã được giao     │ ← Đã đọc
│     Đơn hàng của bạn...             │
│     1 giờ trước                      │
└─────────────────────────────────────┘
```

## Performance Notes

- **Polling interval:** 10 giây
- **Auto-hide popup:** 5 giây
- **Items per page:** 20 notifications
- **Badge update:** Realtime khi đánh dấu đã đọc

## Next Steps

1. **Backend:** Implement notification creation khi approve/reject seller
2. **Test:** Dùng Postman để test API
3. **Integration Test:** Test với frontend
4. **Deploy:** Deploy lên staging/production
5. **Monitor:** Theo dõi số lượng notifications được tạo

## Support

Nếu có vấn đề trong quá trình tích hợp:
1. Kiểm tra `BACKEND_INTEGRATION_GUIDE.md` để biết chi tiết
2. Kiểm tra `NOTIFICATION_SYSTEM.md` để hiểu flow
3. Contact Frontend Team nếu cần support

---

**Status:** ✅ Frontend đã sẵn sàng, chờ Backend tích hợp
**Last Updated:** 2025-10-22

