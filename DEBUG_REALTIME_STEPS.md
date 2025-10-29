# 🔍 Debug: Tại Sao Chưa Real-Time?

## ❓ Vấn Đề

Notification vẫn hiển thị "7 giờ trước" thay vì "Vừa xong"

## 🔍 Phân Tích

### Notification hiện tại đang thấy:

Từ Network tab:
```json
{
  "notificationId": 1,
  "receiverId": 1,
  "type": "SELLER",
  "title": "UPGRADE ACCOUNT INFORMATION RESULT",
  "content": "Phê duyệt thành công",
  "sendAt": "2025-10-29T11:12:06.673165",    // ← 7 giờ trước
  "createdAt": "2025-10-29T11:12:06.673149"  // ← 7 giờ trước
}
```

### 2 Trường Hợp:

#### ❌ Case 1: Load từ API (Không real-time)
```
User click vào icon chuông
  ↓
Frontend gọi API: GET /api/v1/notifications
  ↓
Trả về notifications CŨ từ DB
  ↓
Không có flag `isRealtime`
  ↓
Hiển thị: "7 giờ trước" ← BẠN ĐANG Ở ĐÂY
```

#### ✅ Case 2: Nhận qua WebSocket (Real-time)
```
Admin phê duyệt BÂY GIỜ
  ↓
Backend gửi WebSocket message
  ↓
Frontend nhận ngay lập tức
  ↓
Có flag `isRealtime = true`
  ↓
Hiển thị: "Vừa xong" ← CHƯA TEST
```

---

## 🧪 Cách Test Đúng

### ❌ Test SAI (Không thấy real-time):
1. Admin đã approve từ 7h trước
2. Bạn login BÂY GIỜ
3. Click vào icon chuông
4. → Load notifications cũ từ DB
5. → Thấy "7 giờ trước" ← Đây là ĐÚNG vì nó CŨ!

### ✅ Test ĐÚNG (Sẽ thấy real-time):

**Bước 1: Chuẩn Bị**
1. Login vào account **Buyer** (đã request seller)
2. **ĐỪNG** click icon chuông
3. Mở Console (F12) để xem logs
4. **GIỮ TRANG NÀY MỞ**

**Bước 2: Check WebSocket Connected**

Trong Console phải thấy:
```
🔌 [WebSocket] 🔄 Connecting to backend...
✅ [WebSocket] 🎉 Successfully connected to Backend!
📡 [WebSocket] Subscribing to queue: /queue/notifications/1
✅ [WebSocket] 🎧 Successfully subscribed to notifications!
```

✅ Nếu THẤY = WebSocket đã sẵn sàng  
❌ Nếu KHÔNG THẤY = WebSocket chưa connect → Cần fix

**Bước 3: Admin Approve MỘT LẦN NỮA**

1. Mở tab mới → Login Admin
2. Tìm một seller request **KHÁC** (hoặc tạo seller request mới)
3. Click "Phê duyệt"

**Bước 4: Quan Sát Frontend (Buyer tab)**

Trong vòng **< 1 giây**, phải thấy:

**Console logs:**
```
🔔 [WebSocket] 📩 New notification received from Backend!
📋 [WebSocket] Notification data: {...}
[NotificationService] Received WebSocket notification: {...}
[NotificationService] ⚡ Real-time notification! Will display as "Vừa xong"
New notification: {...}
```

**UI changes:**
1. ✅ **Popup toast** hiện góc phải màn hình
2. ✅ **Badge count** trên icon chuông tăng: 🔔 (2)
3. ✅ Popup hiển thị: **"Vừa xong"** (không phải "7 giờ trước")

**Bước 5: Click Icon Chuông**

1. Click vào icon 🔔
2. Dropdown mở ra
3. → Notification mới nhất hiển thị: **"Vừa xong"** ✅

---

## 🔧 Troubleshooting

### 1. WebSocket Chưa Connected?

**Check Console có thấy:**
```
✅ [WebSocket] Successfully connected to Backend!
```

**Nếu KHÔNG thấy:**

#### Option A: Backend chưa chạy
```bash
# Check backend
curl http://localhost:8080/ws
```

#### Option B: WebSocket config sai

Check `src/environments/environment.js`:
```javascript
WS_URL: 'http://localhost:8080/ws'
```

#### Option C: Token/Auth issue

Check Console có error:
```
❌ [WebSocket] Error
🔄 [NotificationService] Falling back to polling...
```

→ Fix: Re-login để lấy token mới

---

### 2. Backend Chưa Gửi WebSocket?

**Kiểm tra Backend code:**

Backend CẦN có code này khi approve seller:
```java
@Autowired
private SimpMessagingTemplate messagingTemplate;

public void approveSeller(Long sellerId) {
    // 1. Update seller
    seller.setStatus("APPROVED");
    sellerRepository.save(seller);
    
    // 2. Tạo notification
    Notification notification = new Notification();
    notification.setReceiverId(seller.getBuyerId());
    notification.setTitle("...");
    notification.setContent("...");
    notification.setSendAt(LocalDateTime.now());
    notification.setCreatedAt(LocalDateTime.now());
    notificationRepository.save(notification);
    
    // 3. ⭐ QUAN TRỌNG: Gửi qua WebSocket
    String destination = "/queue/notifications/" + seller.getBuyerId();
    messagingTemplate.convertAndSend(destination, notification);
    
    System.out.println("📤 Sent WebSocket to: " + destination);
}
```

**Nếu Backend KHÔNG có code trên:**
→ Backend chỉ save vào DB, KHÔNG gửi WebSocket
→ Frontend sẽ KHÔNG nhận real-time
→ Phải đợi polling (10s) hoặc reload page

---

### 3. Test Với Script

Copy script này vào Console:

```javascript
// Test WebSocket connection
const buyerId = localStorage.getItem('buyerId');
const token = localStorage.getItem('token');

console.log('🔍 Debug Info:');
console.log('- Buyer ID:', buyerId);
console.log('- Token:', token ? 'Exists' : 'Missing');
console.log('- Expected WebSocket destination:', `/queue/notifications/${buyerId}`);
console.log('\n📡 Looking for WebSocket connection in Network tab (WS filter)...');
```

---

## 📊 So Sánh

### Notification CŨ (Từ DB):
```json
{
  "notificationId": 1,
  "sendAt": "2025-10-29T11:12:06",  // 7h trước
  "isRealtime": undefined           // ← Không có flag
}
```
→ Hiển thị: "7 giờ trước" ← **ĐÚNG** vì nó thực sự cũ!

### Notification MỚI (Từ WebSocket):
```json
{
  "notificationId": 2,
  "sendAt": "2025-10-29T18:30:00",  // Timestamp có thể cũ
  "isRealtime": true,               // ← Có flag ✅
  "realtimeReceivedAt": "2025-10-29T18:30:01"  // ← Thời gian nhận THỰC
}
```
→ Hiển thị: "Vừa xong" ← **Real-time!**

---

## ✅ Checklist Test Real-Time

Để thấy **"Vừa xong"**, cần:

- [ ] **Frontend:** Login và GIỮ trang mở (không reload)
- [ ] **Frontend:** WebSocket connected (check Console logs)
- [ ] **Backend:** Đang chạy trên http://localhost:8080
- [ ] **Backend:** Có implement WebSocket send
- [ ] **Admin:** Approve seller **MỘT LẦN NỮA** (không phải notification cũ)
- [ ] **Watch:** Console logs cho WebSocket message
- [ ] **Watch:** Popup toast hiện lên
- [ ] **Verify:** Popup hiển thị "Vừa xong"

---

## 🎯 Kết Luận

### Notification "7 giờ trước" là ĐÚNG vì:
- Nó được tạo từ 7h trước
- Bạn đang load từ API (không phải WebSocket)
- Đó là notification CŨ

### Để test Real-Time:
1. GIỮ trang mở
2. Admin approve **MỘT SELLER MỚI**
3. Quan sát popup + Console logs
4. → Sẽ thấy "Vừa xong" ✅

### Nếu vẫn không thấy:
→ Backend chưa gửi WebSocket
→ Cần Backend implement code gửi WebSocket (xem `BACKEND_NOTIFICATION_TIMESTAMP_FIX.md`)

---

**Next Step:** Chạy test theo đúng flow trên và báo lại kết quả!


