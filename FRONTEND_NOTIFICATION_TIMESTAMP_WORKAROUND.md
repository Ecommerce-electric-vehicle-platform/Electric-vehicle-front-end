# 🔧 Frontend Workaround: Display "Vừa xong" for WebSocket Notifications

## Vấn Đề

Backend gửi notification với timestamp cũ → Frontend hiển thị "7 giờ trước"

## Giải Pháp Tạm Thời (Frontend Only)

Chúng ta có thể thêm logic: Nếu notification được nhận qua WebSocket (real-time), thì hiển thị "Vừa xong" bất kể timestamp.

### Logic:

```
Notification nhận qua WebSocket
  → Chắc chắn là mới (vừa gửi)
  → Gắn flag: isRealtime = true
  → Frontend hiển thị: "Vừa xong"
```

### Implementation:

#### 1. Update notificationService.js

```javascript
// Khi nhận WebSocket notification
websocketService.subscribe(destination, (notification) => {
  const transformedNotification = {
    notificationId: notification.notificationId,
    title: notification.title || "Thông báo",
    message: notification.content || "",
    type: this.detectType(notification.title, notification.content),
    isRead: !!notification.readAt,
    createdAt: notification.createdAt || notification.sendAt,
    receiverId: notification.receiverId,
    
    // ⭐ Thêm flag để đánh dấu là real-time
    isRealtime: true,
    realtimeReceivedAt: new Date().toISOString()
  };
  
  this.notify(transformedNotification);
});
```

#### 2. Update NotificationPopup.jsx & NotificationList.jsx

```javascript
const getRelativeTime = (timestamp, isRealtime, realtimeReceivedAt) => {
  // ⭐ Nếu là real-time notification, ưu tiên hiển thị "Vừa xong"
  if (isRealtime && realtimeReceivedAt) {
    const now = new Date();
    const receivedTime = new Date(realtimeReceivedAt);
    const diffMs = now - receivedTime;
    const diffSecs = Math.floor(diffMs / 1000);
    
    // Trong vòng 60 giây thì hiển thị "Vừa xong"
    if (diffSecs < 60) return "Vừa xong";
    
    // Sau đó mới tính theo thời gian thực
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins} phút trước`;
  }
  
  // Fallback to original logic
  if (!timestamp) return "Vừa xong";
  
  const now = new Date();
  const notifTime = new Date(timestamp);
  const diffMs = now - notifTime;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngày trước`;
};
```

### Ưu Điểm:
- ✅ Fix ngay lập tức (không cần đợi Backend)
- ✅ Hiển thị "Vừa xong" cho notification real-time
- ✅ Không ảnh hưởng notification cũ (vẫn hiển thị đúng thời gian)

### Nhược Điểm:
- ⚠️ Là workaround, không phải giải pháp gốc
- ⚠️ Backend vẫn nên fix timestamp đúng
- ⚠️ Nếu user reload page, notification cũ sẽ mất flag `isRealtime`

## Giải Pháp Tốt Nhất

**Backend phải fix:** Tạo notification MỚI với `LocalDateTime.now()`

Xem file: `BACKEND_NOTIFICATION_TIMESTAMP_FIX.md`

---

Last Updated: 2025-10-29


