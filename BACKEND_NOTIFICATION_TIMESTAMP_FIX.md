# 🔧 FIX: Notification Timestamp - Backend

## ❌ Vấn Đề Hiện Tại

User phê duyệt Seller **BÂY GIỜ**, nhưng notification hiển thị "7 giờ trước".

**Nguyên nhân:** Backend đang gửi lại notification CŨ thay vì tạo MỚI.

### Ví dụ Sai:
```json
{
  "sendAt": "2025-10-29T11:12:06",    // ❌ 7 giờ trước
  "createdAt": "2025-10-29T11:12:06"  // ❌ 7 giờ trước
}
```

Frontend tính: `now - createdAt = 7 giờ` → Hiển thị "7 giờ trước"

---

## ✅ Giải Pháp 1: Tạo Notification MỚI (RECOMMENDED)

### Backend Code:

```java
@Service
public class SellerService {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    public void approveSeller(Long sellerId) {
        // 1. Update seller status
        Seller seller = sellerRepository.findById(sellerId).orElseThrow();
        seller.setStatus("APPROVED");
        sellerRepository.save(seller);
        
        // 2. ⭐ TẠO NOTIFICATION MỚI với timestamp HIỆN TẠI
        Notification notification = new Notification();
        notification.setReceiverId(seller.getBuyerId());
        notification.setType("BUYER");
        notification.setTitle("Yêu cầu nâng cấp Seller đã được phê duyệt ✅");
        notification.setContent("Chúc mừng! Yêu cầu nâng cấp lên Seller của bạn đã được phê duyệt. Vui lòng mua gói Seller để kích hoạt.");
        
        // ⭐ QUAN TRỌNG: Dùng LocalDateTime.now()
        notification.setSendAt(LocalDateTime.now());     // ✅ Thời gian HIỆN TẠI
        notification.setCreatedAt(LocalDateTime.now());  // ✅ Thời gian HIỆN TẠI
        notification.setReadAt(null);
        
        // 3. Lưu vào DB
        notificationRepository.save(notification);
        
        // 4. ⭐ GỬI QUA WEBSOCKET
        String destination = "/queue/notifications/" + seller.getBuyerId();
        messagingTemplate.convertAndSend(destination, notification);
        
        System.out.println("📤 [WebSocket] Sent notification at: " + LocalDateTime.now());
    }
}
```

### Kết Quả:
```json
{
  "sendAt": "2025-10-29T18:30:45",    // ✅ HIỆN TẠI
  "createdAt": "2025-10-29T18:30:45"  // ✅ HIỆN TẠI
}
```

Frontend hiển thị: **"Vừa xong"** ⚡

---

## ✅ Giải Pháp 2: Update Notification Cũ (Alternative)

Nếu bạn muốn **update** notification cũ thay vì tạo mới:

```java
public void approveSeller(Long sellerId) {
    Seller seller = sellerRepository.findById(sellerId).orElseThrow();
    seller.setStatus("APPROVED");
    sellerRepository.save(seller);
    
    // Tìm notification cũ
    Notification notification = notificationRepository
        .findPendingNotificationBySellerId(sellerId)
        .orElseGet(() -> {
            // Nếu không tìm thấy, tạo mới
            Notification newNotif = new Notification();
            newNotif.setReceiverId(seller.getBuyerId());
            newNotif.setType("BUYER");
            newNotif.setTitle("Yêu cầu nâng cấp Seller đã được phê duyệt ✅");
            newNotif.setContent("Chúc mừng! Yêu cầu nâng cấp...");
            return newNotif;
        });
    
    // ⭐ CẬP NHẬT timestamp HIỆN TẠI
    notification.setSendAt(LocalDateTime.now());     // ✅ Update thành hiện tại
    notification.setCreatedAt(LocalDateTime.now());  // ✅ Update thành hiện tại
    notification.setReadAt(null);
    
    notificationRepository.save(notification);
    
    // Gửi qua WebSocket
    String destination = "/queue/notifications/" + seller.getBuyerId();
    messagingTemplate.convertAndSend(destination, notification);
}
```

---

## 🔍 Check Backend hiện tại

### Câu hỏi cần trả lời:

1. **Backend có đang tạo notification MỚI không?**
   ```java
   // Check code trong approveSeller()
   // Có dòng này không?
   notification.setSendAt(LocalDateTime.now());
   notification.setCreatedAt(LocalDateTime.now());
   ```

2. **Backend có đang gửi lại notification CŨ không?**
   ```java
   // Có đang query notification cũ từ DB?
   Notification oldNotif = notificationRepository.findBySellerId(...);
   messagingTemplate.convertAndSend(destination, oldNotif); // ❌ SAI!
   ```

---

## 🧪 Test

### Test 1: Check Backend Logs

Khi admin approve, backend logs phải show:
```
📤 [WebSocket] Creating new notification at: 2025-10-29T18:30:45
📤 [WebSocket] Sent notification to: /queue/notifications/123
```

### Test 2: Check Response

Network tab phải show:
```json
{
  "notificationId": 999,  // ID mới (lớn hơn IDs cũ)
  "sendAt": "2025-10-29T18:30:45",    // ✅ Thời gian VỪA APPROVE
  "createdAt": "2025-10-29T18:30:45"  // ✅ Thời gian VỪA APPROVE
}
```

### Test 3: Frontend Display

Notification phải hiển thị:
- ✅ **"Vừa xong"** (nếu < 1 phút)
- ✅ **"1 phút trước"** (nếu ~1 phút)
- ❌ **KHÔNG phải "7 giờ trước"**

---

## 📋 Checklist cho Backend Developer

### Khi approve seller, đảm bảo:

- [ ] **Tạo Notification MỚI** (không reuse notification cũ)
- [ ] **Set `sendAt = LocalDateTime.now()`**
- [ ] **Set `createdAt = LocalDateTime.now()`**
- [ ] **Set `readAt = null`** (chưa đọc)
- [ ] **Save vào DB**
- [ ] **Gửi qua WebSocket**
- [ ] **Log timestamp để verify**

### Code Template:

```java
// ✅ ĐÚNG
Notification notification = new Notification();
notification.setReceiverId(buyer.getId());
notification.setTitle("...");
notification.setContent("...");
notification.setSendAt(LocalDateTime.now());      // ⭐
notification.setCreatedAt(LocalDateTime.now());   // ⭐
notification.setReadAt(null);
notificationRepository.save(notification);

messagingTemplate.convertAndSend("/queue/notifications/" + buyer.getId(), notification);
```

```java
// ❌ SAI
Notification oldNotif = notificationRepository.findById(123).get();
// oldNotif vẫn có timestamp cũ!
messagingTemplate.convertAndSend("/queue/notifications/" + buyer.getId(), oldNotif);
```

---

## 🎯 Kết Quả Mong Đợi

### Before (Hiện tại):
```
Admin approve → Backend gửi notification cũ (7h trước)
→ Frontend hiển thị: "7 giờ trước" ❌
```

### After (Sau fix):
```
Admin approve → Backend tạo notification MỚI (LocalDateTime.now())
→ Frontend hiển thị: "Vừa xong" ✅
→ Real-time notification < 1 giây ⚡
```

---

## 📞 Liên Hệ Backend Team

**Vấn đề:** Notification timestamp không đúng  
**Nguyên nhân:** Backend gửi notification cũ  
**Giải pháp:** Tạo notification MỚI với `LocalDateTime.now()`  
**File cần sửa:** `SellerService.java` hoặc `AdminController.java`  
**Method:** `approveSeller()`  

---

**Priority:** 🔴 High  
**Impact:** User experience - Notification không real-time  
**Effort:** 5 phút (1 dòng code)  

---

Last Updated: 2025-10-29


