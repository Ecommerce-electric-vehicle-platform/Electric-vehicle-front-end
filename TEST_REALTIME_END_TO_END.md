# 🧪 Test End-to-End: Frontend ↔ Backend WebSocket Real-Time

## 🎯 Mục Tiêu

Đảm bảo flow hoàn chỉnh:
```
Frontend → Backend → WebSocket → Frontend
```

---

## 📋 Checklist Hoàn Chỉnh

### ✅ Phase 1: Frontend Setup (Đã Xong)
- [x] WebSocket service implemented
- [x] Notification service implemented  
- [x] buyerId/sellerId lưu vào localStorage sau login
- [x] Components hiển thị notification
- [x] Timestamp fix ("Vừa xong")

### 🔄 Phase 2: Verify Connection (Cần Test)
- [ ] WebSocket connect thành công
- [ ] Subscribe đúng destination
- [ ] buyerId/sellerId có trong localStorage

### 🔄 Phase 3: Backend Integration (Cần Check)
- [ ] Backend WebSocket config
- [ ] Backend gửi notification khi approve
- [ ] Message format đúng

### 🔄 Phase 4: End-to-End Test (Cần Test)
- [ ] Admin approve → Frontend nhận real-time
- [ ] Popup hiển thị ngay lập tức
- [ ] Timestamp hiển thị "Vừa xong"

---

## 🧪 Test Script - Copy Vào Console

### **Test 1: Verify Frontend Ready**

```javascript
// ==========================================
// TEST 1: VERIFY FRONTEND READY
// ==========================================
console.log('\n╔══════════════════════════════════════════╗');
console.log('║  TEST 1: VERIFY FRONTEND READY         ║');
console.log('╚══════════════════════════════════════════╝\n');

const buyerId = localStorage.getItem('buyerId');
const sellerId = localStorage.getItem('sellerId');
const token = localStorage.getItem('token');
const userRole = localStorage.getItem('userRole');

console.log('📊 localStorage Check:');
console.log('  ✅ buyerId:', buyerId || '❌ MISSING');
console.log('  ✅ sellerId:', sellerId || '(Optional)');
console.log('  ✅ token:', token ? '✅ Exists' : '❌ MISSING');
console.log('  ✅ userRole:', userRole || '❌ MISSING');

const userId = buyerId || sellerId;

if (!userId) {
    console.error('\n❌ FAILED: No buyerId or sellerId!');
    console.log('\n🔧 FIX: Logout and login again to save IDs.');
    console.log('   Or run the quick fix script from previous message.');
} else {
    console.log('\n✅ PASS: Frontend has user ID');
    console.log('📡 Expected WebSocket destination:', `/queue/notifications/${userId}`);
}

if (!token) {
    console.error('\n❌ FAILED: No token! Please login.');
} else {
    console.log('✅ PASS: Token exists');
}

console.log('\n' + '='.repeat(50));
```

---

### **Test 2: Check WebSocket Connection**

```javascript
// ==========================================
// TEST 2: CHECK WEBSOCKET CONNECTION
// ==========================================
console.log('\n╔══════════════════════════════════════════╗');
console.log('║  TEST 2: CHECK WEBSOCKET CONNECTION    ║');
console.log('╚══════════════════════════════════════════╝\n');

console.log('📡 Looking for WebSocket connection logs...\n');
console.log('Expected logs:');
console.log('  ✅ "🔌 [WebSocket] Connecting to backend..."');
console.log('  ✅ "✅ [WebSocket] Successfully connected!"');
console.log('  ✅ "📡 [WebSocket] Subscribing to queue..."');
console.log('  ✅ "✅ [WebSocket] Successfully subscribed!"');

console.log('\n⚠️ If you DON\'T see these logs above:');
console.log('   → WebSocket not connected');
console.log('   → Check Backend is running on http://localhost:8080');
console.log('   → Check WebSocket endpoint: /ws');

console.log('\n💡 Scroll up in Console to find these logs!');
console.log('\n' + '='.repeat(50));
```

---

### **Test 3: Send Test Notification (Frontend → Backend)**

```javascript
// ==========================================
// TEST 3: SEND TEST NOTIFICATION REQUEST
// ==========================================
console.log('\n╔══════════════════════════════════════════╗');
console.log('║  TEST 3: SEND TEST NOTIFICATION        ║');
console.log('╚══════════════════════════════════════════╝\n');

(async function testSendNotification() {
    const token = localStorage.getItem('token');
    const buyerId = localStorage.getItem('buyerId') || localStorage.getItem('sellerId');
    
    if (!token) {
        console.error('❌ No token. Please login first.');
        return;
    }
    
    if (!buyerId) {
        console.error('❌ No buyerId. Please logout and login again.');
        return;
    }
    
    console.log('📤 Sending test notification request to Backend...');
    console.log('   Receiver ID:', buyerId);
    
    try {
        // Gọi API test endpoint (Backend cần tạo endpoint này)
        const response = await fetch('http://localhost:8080/api/v1/test/send-notification/' + buyerId, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('✅ Test notification sent!');
            console.log('\n⏰ Watch for:');
            console.log('   1. Console log: "🔔 [WebSocket] New notification received!"');
            console.log('   2. Popup appears on screen');
            console.log('   3. Badge count increases');
            console.log('\nWait 1-2 seconds...');
        } else {
            console.error('❌ Failed:', response.status, response.statusText);
            console.log('\n💡 Backend test endpoint may not exist yet.');
            console.log('   Backend needs to create: POST /api/v1/test/send-notification/{buyerId}');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.message.includes('Failed to fetch')) {
            console.log('\n❌ Cannot connect to Backend!');
            console.log('   → Check Backend is running on http://localhost:8080');
        }
    }
})();

console.log('\n' + '='.repeat(50));
```

---

### **Test 4: Full Diagnostic**

```javascript
// ==========================================
// TEST 4: FULL DIAGNOSTIC
// ==========================================
console.log('\n╔══════════════════════════════════════════╗');
console.log('║  TEST 4: FULL DIAGNOSTIC               ║');
console.log('╚══════════════════════════════════════════╝\n');

(async function fullDiagnostic() {
    // 1. Check localStorage
    console.log('1️⃣ localStorage Status:');
    const buyerId = localStorage.getItem('buyerId');
    const sellerId = localStorage.getItem('sellerId');
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    console.log('   buyerId:', buyerId ? `✅ ${buyerId}` : '❌ Missing');
    console.log('   sellerId:', sellerId ? `✅ ${sellerId}` : '(Not required for buyer)');
    console.log('   token:', token ? '✅ Exists' : '❌ Missing');
    console.log('   userRole:', userRole ? `✅ ${userRole}` : '❌ Missing');
    
    const userId = buyerId || sellerId;
    
    // 2. Check Backend connection
    console.log('\n2️⃣ Backend Connection:');
    try {
        const response = await fetch('http://localhost:8080/api/v1/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('   ✅ Backend reachable');
            const data = await response.json();
            console.log('   ✅ Notifications API working');
            console.log('   📊 Current notifications:', Array.isArray(data) ? data.length : 0);
        } else {
            console.log('   ❌ Backend returned:', response.status);
        }
    } catch (error) {
        console.log('   ❌ Cannot connect to Backend');
        console.log('   Error:', error.message);
    }
    
    // 3. WebSocket status
    console.log('\n3️⃣ WebSocket Status:');
    console.log('   Expected destination:', `/queue/notifications/${userId}`);
    console.log('   Check logs above for:');
    console.log('   - "✅ [WebSocket] Successfully connected!"');
    console.log('   - "✅ [WebSocket] Successfully subscribed!"');
    
    // 4. Summary
    console.log('\n4️⃣ Summary:');
    let allGood = true;
    
    if (!userId) {
        console.log('   ❌ No user ID → Logout and login again');
        allGood = false;
    }
    
    if (!token) {
        console.log('   ❌ No token → Please login');
        allGood = false;
    }
    
    if (allGood) {
        console.log('   ✅ Frontend setup complete!');
        console.log('\n💡 Next: Test with real seller approval');
    }
    
    console.log('\n' + '='.repeat(50));
})();
```

---

## 📝 Backend Test Endpoint (Cần Tạo)

### Backend Controller:

```java
@RestController
@RequestMapping("/api/v1/test")
public class TestNotificationController {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    @PostMapping("/send-notification/{buyerId}")
    public ResponseEntity<?> sendTestNotification(@PathVariable Long buyerId) {
        System.out.println("📤 [TEST] Sending test notification to buyerId: " + buyerId);
        
        // 1. Tạo notification trong DB
        Notification notification = new Notification();
        notification.setReceiverId(buyerId);
        notification.setType("BUYER");
        notification.setTitle("🧪 TEST - Real-Time Notification");
        notification.setContent("Đây là test notification để verify WebSocket hoạt động. Thời gian: " + LocalDateTime.now());
        notification.setSendAt(LocalDateTime.now());
        notification.setCreatedAt(LocalDateTime.now());
        notification.setReadAt(null);
        
        notificationRepository.save(notification);
        System.out.println("✅ [TEST] Notification saved to DB: " + notification.getNotificationId());
        
        // 2. Gửi qua WebSocket
        String destination = "/queue/notifications/" + buyerId;
        messagingTemplate.convertAndSend(destination, notification);
        System.out.println("✅ [TEST] WebSocket message sent to: " + destination);
        
        // 3. Return response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Test notification sent");
        response.put("destination", destination);
        response.put("notificationId", notification.getNotificationId());
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/websocket-status")
    public ResponseEntity<?> getWebSocketStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("websocketEnabled", true);
        status.put("endpoint", "/ws");
        status.put("brokerEnabled", true);
        status.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(status);
    }
}
```

---

## 🎯 Test Flow Hoàn Chỉnh

### **Bước 1: Verify Frontend (3 phút)**

1. Mở Console
2. Run Test 1: Verify localStorage
3. Run Test 2: Check WebSocket logs
4. ✅ Đảm bảo có buyerId và WebSocket connected

---

### **Bước 2: Backend Tạo Test Endpoint (5 phút)**

Backend developer:
1. Tạo `TestNotificationController.java`
2. Thêm endpoint `POST /api/v1/test/send-notification/{buyerId}`
3. Restart backend
4. Test endpoint bằng Postman hoặc curl

---

### **Bước 3: Test End-to-End (2 phút)**

1. Frontend: Mở Console
2. Run Test 3: Send test notification
3. Quan sát:
   - ✅ Backend logs: "📤 [TEST] Sending test notification..."
   - ✅ Frontend logs: "🔔 [WebSocket] New notification received!"
   - ✅ Popup hiện lên màn hình
   - ✅ Badge count tăng
   - ✅ Hiển thị: "Vừa xong"

---

### **Bước 4: Test With Real Approval (5 phút)**

1. Tạo seller request MỚI (account khác)
2. Admin approve
3. Verify notification hiển thị real-time

---

## 📊 Expected Results

### ✅ Thành Công:

**Frontend Console:**
```
📤 Sending test notification request to Backend...
✅ Test notification sent!

🔔 [WebSocket] 📩 New notification received from Backend!
📋 [WebSocket] Notification data: {
  notificationId: 999,
  title: "🧪 TEST - Real-Time Notification",
  content: "Đây là test notification...",
  sendAt: "2025-10-29T18:30:00"
}
[NotificationService] ⚡ Real-time notification! Will display as "Vừa xong"
New notification: {...}
```

**Backend Console:**
```
📤 [TEST] Sending test notification to buyerId: 123
✅ [TEST] Notification saved to DB: 999
✅ [TEST] WebSocket message sent to: /queue/notifications/123
```

**UI:**
- ✅ Popup toast hiện góc phải
- ✅ Hiển thị: "🧪 TEST - Real-Time Notification"
- ✅ Time: "Vừa xong"
- ✅ Badge count tăng

---

## 🐛 Troubleshooting

### Problem 1: Test 1 Failed - No buyerId

**Fix:**
```javascript
// Logout and login again
// Or run quick fix script (from previous message)
```

---

### Problem 2: Test 2 Failed - WebSocket Not Connected

**Check:**
1. Backend running on port 8080?
2. WebSocket config in Backend?
3. Firewall blocking?

---

### Problem 3: Test 3 Failed - Backend Endpoint Not Found

**Fix:**
```
Backend needs to create test endpoint
See Backend code above
```

---

### Problem 4: No Popup Appears

**Check:**
1. Console có log "🔔 [WebSocket] New notification received!" không?
   - Có → UI issue, check NotificationPopup component
   - Không → Backend không gửi hoặc WebSocket not subscribed

---

## 🎯 Success Criteria

✅ Test 1: localStorage có buyerId  
✅ Test 2: WebSocket connected và subscribed  
✅ Test 3: Test notification gửi và nhận thành công  
✅ Test 4: Full diagnostic pass  
✅ Popup hiển thị "Vừa xong"  
✅ Real approval notification work  

---

## 📞 Next Steps

1. **Run Test 1-4** trong Console
2. **Backend tạo test endpoint** (nếu chưa có)
3. **Test end-to-end** với test endpoint
4. **Test real approval** flow
5. **Report results** nếu có issue

---

**Ready to test? Copy scripts vào Console và bắt đầu!** 🚀


