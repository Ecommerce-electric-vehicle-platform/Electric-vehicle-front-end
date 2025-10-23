# 🔗 Backend Integration Guide - Notification System

## Mục đích

Hướng dẫn Backend Developer tích hợp hệ thống thông báo khi Admin phê duyệt Seller.

## Flow khi Admin phê duyệt Seller

```
1. Admin click "Phê duyệt" trong Admin Dashboard
   ↓
2. Frontend gọi: POST /api/v1/admin/approve-seller
   Body: { sellerId, decision: "APPROVED", message }
   ↓
3. ⭐ Backend xử lý:
   a. Cập nhật seller status
   b. TẠO NOTIFICATION cho buyer
   ↓
4. Buyer polling mỗi 10s
   ↓
5. Buyer nhận notification mới → Popup hiển thị
```

## ⭐ Điều Backend cần làm

### Khi approve seller thành công:

```java
// Pseudo-code
public void approveSeller(Long sellerId, String decision) {
    // 1. Update seller status
    Seller seller = sellerRepository.findById(sellerId);
    seller.setStatus("APPROVED");
    sellerRepository.save(seller);
    
    // 2. ⭐ TẠO NOTIFICATION cho buyer
    Long buyerId = seller.getBuyerId(); // Lấy ID của buyer
    
    createNotification(
        buyerId,
        "Yêu cầu nâng cấp Seller đã được phê duyệt ✅",
        "Chúc mừng! Yêu cầu nâng cấp lên Seller của bạn đã được phê duyệt. Vui lòng mua gói Seller để kích hoạt tính năng đăng bán sản phẩm."
    );
}

private void createNotification(Long receiverId, String title, String content) {
    Notification notification = new Notification();
    notification.setReceiverId(receiverId);
    notification.setType("BUYER");
    notification.setTitle(title);
    notification.setContent(content);
    notification.setSendAt(LocalDateTime.now());
    notification.setReadAt(null); // Chưa đọc
    notification.setCreatedAt(LocalDateTime.now());
    
    notificationRepository.save(notification);
}
```

## API endpoint để tạo notification

### POST /api/v1/notifications/new-notification

**Request Body:**
```json
{
  "notificationId": 0,
  "receiverId": 456,
  "type": "BUYER",
  "title": "Yêu cầu nâng cấp Seller đã được phê duyệt ✅",
  "content": "Chúc mừng! Yêu cầu nâng cấp lên Seller của bạn đã được phê duyệt. Vui lòng mua gói Seller để kích hoạt tính năng đăng bán sản phẩm.",
  "sendAt": "2025-10-22T10:00:00.520Z",
  "readAt": null,
  "createdAt": "2025-10-22T10:00:00.520Z"
}
```

## Các loại notification phổ biến

### 1. Phê duyệt thành công ✅

```json
{
  "receiverId": <buyerId>,
  "type": "BUYER",
  "title": "Yêu cầu nâng cấp Seller đã được phê duyệt ✅",
  "content": "Chúc mừng! Yêu cầu nâng cấp lên Seller của bạn đã được phê duyệt. Vui lòng mua gói Seller để kích hoạt.",
  "sendAt": "2025-10-22T10:00:00Z",
  "readAt": null,
  "createdAt": "2025-10-22T10:00:00Z"
}
```

**Frontend sẽ:**
- Auto-detect type = "success" (vì có từ "phê duyệt")
- Hiển thị icon ✓ màu xanh lá
- Popup toast ở góc phải màn hình
- Navigate đến `/profile` khi click

### 2. Từ chối yêu cầu ❌

```json
{
  "receiverId": <buyerId>,
  "type": "BUYER",
  "title": "Yêu cầu nâng cấp Seller bị từ chối ❌",
  "content": "Rất tiếc, yêu cầu nâng cấp của bạn bị từ chối. Lý do: Giấy tờ không hợp lệ. Vui lòng kiểm tra và gửi lại.",
  "sendAt": "2025-10-22T10:00:00Z",
  "readAt": null,
  "createdAt": "2025-10-22T10:00:00Z"
}
```

**Frontend sẽ:**
- Auto-detect type = "error" (vì có từ "từ chối")
- Hiển thị icon ✕ màu đỏ

### 3. Đơn hàng cập nhật 📦

```json
{
  "receiverId": <buyerId>,
  "type": "BUYER",
  "title": "Đơn hàng #123 đã được giao thành công 📦",
  "content": "Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm!",
  "sendAt": "2025-10-22T10:00:00Z",
  "readAt": null,
  "createdAt": "2025-10-22T10:00:00Z"
}
```

**Frontend sẽ:**
- Auto-detect type = "success" (vì có từ "thành công")
- Navigate đến `/orders` khi click

### 4. Cảnh báo hệ thống ⚠️

```json
{
  "receiverId": <buyerId>,
  "type": "BUYER",
  "title": "Cảnh báo: Tài khoản sắp hết hạn ⚠️",
  "content": "Gói Seller của bạn sẽ hết hạn vào 3 ngày nữa. Vui lòng gia hạn để tiếp tục sử dụng.",
  "sendAt": "2025-10-22T10:00:00Z",
  "readAt": null,
  "createdAt": "2025-10-22T10:00:00Z"
}
```

**Frontend sẽ:**
- Auto-detect type = "warning" (vì có từ "cảnh báo")
- Hiển thị icon ⚠ màu vàng

## Auto-detect Logic (Frontend)

Frontend tự động phát hiện type từ `title` và `content`:

| Keywords trong text | Type | Icon | Màu |
|-------------------|------|------|-----|
| phê duyệt, thành công, hoàn thành, accepted | success | ✓ | Xanh lá |
| từ chối, thất bại, lỗi, failed, rejected | error | ✕ | Đỏ |
| cảnh báo, chú ý, warning, pending | warning | ⚠ | Vàng |
| Còn lại | info | ℹ | Xanh dương |

## Best Practices

### 1. Title nên ngắn gọn
✅ Good: "Yêu cầu nâng cấp Seller đã được phê duyệt"
❌ Bad: "Xin chào bạn, chúng tôi rất vui thông báo rằng yêu cầu nâng cấp lên Seller của bạn đã được xét duyệt và phê duyệt thành công"

### 2. Content nên có call-to-action
✅ Good: "Vui lòng mua gói Seller để kích hoạt."
❌ Bad: "Bạn đã được phê duyệt."

### 3. Sử dụng emoji phù hợp
✅ ✓ ✕ ⚠ ℹ 📦 💰 🎉
❌ Quá nhiều emoji trong một notification

### 4. Timing
- Tạo notification **ngay sau khi** action thành công
- Set `sendAt` = hiện tại
- Set `readAt` = null (chưa đọc)

### 5. receiverId
- Luôn đảm bảo `receiverId` đúng
- Đối với seller approval: receiverId = buyerId của seller đó

## Testing

### Test locally với Postman

1. **Tạo notification thủ công:**
```bash
POST http://localhost:8080/api/v1/notifications/new-notification
Content-Type: application/json

{
  "notificationId": 0,
  "receiverId": YOUR_BUYER_ID,
  "type": "BUYER",
  "title": "Test Notification - Phê duyệt thành công",
  "content": "Đây là test notification",
  "sendAt": "2025-10-22T10:00:00.520Z",
  "readAt": null,
  "createdAt": "2025-10-22T10:00:00.520Z"
}
```

2. **Login frontend với buyer account**
3. **Đợi tối đa 10 giây** → popup sẽ hiển thị

### Test với approval flow

1. Buyer gửi yêu cầu nâng cấp seller
2. Admin approve trong dashboard
3. Backend tạo notification
4. Buyer nhận popup realtime

## Troubleshooting

### Notification không hiển thị?

**Kiểm tra Backend:**
1. ✅ Notification đã được tạo trong database?
2. ✅ `receiverId` đúng với buyer ID?
3. ✅ `readAt` = null?

**Kiểm tra Frontend:**
1. ✅ Buyer đã đăng nhập?
2. ✅ Console có log "🔔 Starting notification polling..."?
3. ✅ Network tab có request GET /api/v1/notifications mỗi 10s?

### Badge count không đúng?

Backend đảm bảo:
- Notifications chưa đọc có `readAt = null`
- Đã đọc có `readAt = timestamp`

### Performance issues?

Nếu có quá nhiều notifications:
- Implement pagination đúng cách
- Consider cleanup old read notifications (90 days+)
- Add index trên `receiverId`, `readAt`, `createdAt`

## Database Schema (Suggestion)

```sql
CREATE TABLE notifications (
  notification_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  receiver_id BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'BUYER',
  title VARCHAR(255) NOT NULL,
  content TEXT,
  send_at TIMESTAMP NOT NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_receiver_id (receiver_id),
  INDEX idx_read_at (read_at),
  INDEX idx_created_at (created_at)
);
```

## Summary Checklist

Khi implement notification cho bất kỳ feature nào:

- [ ] Tạo notification **ngay sau** action thành công
- [ ] Set đúng `receiverId`
- [ ] Title ngắn gọn, có ý nghĩa
- [ ] Content có call-to-action rõ ràng
- [ ] Sử dụng keywords để frontend auto-detect type
- [ ] Set `readAt = null` cho notification mới
- [ ] Test với frontend để đảm bảo popup hiển thị
- [ ] Kiểm tra badge count cập nhật đúng

## Contact

Nếu có thắc mắc về tích hợp notification system, liên hệ Frontend Team.

