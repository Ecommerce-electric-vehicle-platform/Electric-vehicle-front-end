# ❌ Backend API Error 500 - Cần Fix

## 🔴 Vấn đề

Frontend đang gọi API nhưng backend trả về lỗi 500:

```
API Error [500] /api/v1/notifications: Internal Server Error
{
  timestamp: '2025-10-22T05:50:08.944+00:00',
  status: 500,
  error: 'Internal Server Error',
  path: '/api/v1/notifications'
}
```

## 📋 Endpoint đang lỗi

**GET /api/v1/notifications**

Query params:
- `page`: 0
- `size`: 20 (hoặc 5)

## 🔍 Cần kiểm tra Backend

### 1. Kiểm tra Controller

```java
@GetMapping
public ResponseEntity<?> getNotifications(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    Authentication authentication // ⭐ Cần lấy user từ token
) {
    try {
        // Lấy buyerId từ token
        String username = authentication.getName();
        User user = userRepository.findByUsername(username);
        Long buyerId = user.getBuyerId();
        
        // Lấy notifications của buyer này
        Page<Notification> notifications = notificationService
            .getNotificationsByReceiverId(buyerId, PageRequest.of(page, size));
        
        return ResponseEntity.ok(notifications.getContent());
    } catch (Exception e) {
        log.error("Error getting notifications", e);
        return ResponseEntity.status(500).body("Internal Server Error");
    }
}
```

### 2. Các lỗi thường gặp

#### ❌ Lỗi 1: Không lấy được user từ token

**Nguyên nhân:** Authentication null hoặc không parse được

**Fix:**
```java
// Đảm bảo endpoint có @PreAuthorize hoặc check auth
@PreAuthorize("hasRole('BUYER')")
@GetMapping
public ResponseEntity<?> getNotifications(...)
```

#### ❌ Lỗi 2: Query database lỗi

**Nguyên nhân:** Relationship không đúng, table không tồn tại

**Fix:** Check query:
```java
// Repository
@Query("SELECT n FROM Notification n WHERE n.receiverId = :receiverId ORDER BY n.createdAt DESC")
Page<Notification> findByReceiverId(@Param("receiverId") Long receiverId, Pageable pageable);
```

#### ❌ Lỗi 3: Serialization lỗi

**Nguyên nhân:** Entity có circular reference hoặc lazy loading

**Fix:**
```java
// Dùng DTO thay vì trả về Entity trực tiếp
public class NotificationDTO {
    private Long notificationId;
    private Long receiverId;
    private String type;
    private String title;
    private String content;
    private LocalDateTime sendAt;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
}
```

### 3. Response format cần trả về

```json
[
  {
    "notificationId": 1,
    "receiverId": 123,
    "type": "BUYER",
    "title": "Yêu cầu nâng cấp Seller đã được phê duyệt",
    "content": "Chúc mừng! Yêu cầu nâng cấp...",
    "sendAt": "2025-10-22T10:00:00Z",
    "readAt": null,
    "createdAt": "2025-10-22T10:00:00Z"
  }
]
```

**Lưu ý:**
- Trả về **Array trực tiếp**, không wrap trong object
- `readAt` = `null` nếu chưa đọc
- Sắp xếp theo `createdAt DESC` (mới nhất trước)

## 🔧 Debug Steps cho Backend

### 1. Check logs

Xem stack trace lỗi 500:
```bash
tail -f logs/application.log
# Hoặc
docker logs backend-container -f
```

### 2. Test endpoint với Postman

```bash
GET http://localhost:8080/api/v1/notifications?page=0&size=20
Authorization: Bearer YOUR_TOKEN
```

**Expected Response:** 200 OK với array notifications

### 3. Kiểm tra database

```sql
-- Check table tồn tại
SHOW TABLES LIKE 'notification%';

-- Check structure
DESCRIBE notifications;

-- Check có data không
SELECT * FROM notifications LIMIT 5;

-- Check có notification nào cho user không
SELECT * FROM notifications WHERE receiverId = 123;
```

### 4. Temporary fix để test

Nếu chưa implement đầy đủ, return mock data:

```java
@GetMapping
public ResponseEntity<?> getNotifications() {
    // Temporary mock for testing
    List<Map<String, Object>> mockData = new ArrayList<>();
    Map<String, Object> notif = new HashMap<>();
    notif.put("notificationId", 1);
    notif.put("receiverId", 123);
    notif.put("type", "BUYER");
    notif.put("title", "Test Notification");
    notif.put("content", "This is a test");
    notif.put("sendAt", LocalDateTime.now());
    notif.put("readAt", null);
    notif.put("createdAt", LocalDateTime.now());
    
    mockData.add(notif);
    return ResponseEntity.ok(mockData);
}
```

## ✅ Checklist để fix

Backend team cần:

- [ ] Check logs để xem lỗi cụ thể
- [ ] Đảm bảo endpoint có authentication
- [ ] Lấy được buyerId từ token
- [ ] Query database thành công
- [ ] Trả về correct response format (array)
- [ ] Test với Postman trước khi integrate
- [ ] Xử lý case: user chưa có notification nào → return `[]`

## 🎯 Sau khi Backend fix xong

### Test lại:

1. **Postman:**
```bash
GET http://localhost:8080/api/v1/notifications
Authorization: Bearer <token>

Expected: 200 OK
Response: [...]
```

2. **Frontend sẽ tự động hoạt động:**
- Polling mỗi 10s
- Hiển thị popup khi có notification mới
- Badge count cập nhật
- Click vào notification → Navigate đến page tương ứng

## 📞 Contact

Nếu cần support, ping Frontend Team.

---

**Status:** 🔴 Đang chờ Backend fix API  
**Priority:** High  
**Impact:** Notification system không hoạt động

