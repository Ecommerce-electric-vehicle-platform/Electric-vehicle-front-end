# ⚡ WebSocket Integration - Summary

## 🎉 Đã hoàn thành

Frontend đã được upgrade để hỗ trợ **WebSocket realtime** thay vì polling 10s!

## 📦 Files mới tạo

### 1. WebSocket Service
✅ **`src/services/websocketService.js`**
- Connect đến WebSocket endpoint
- Subscribe to topics
- Auto reconnect khi disconnect
- Fallback to polling nếu WebSocket fail

### 2. Documentation
✅ **`WEBSOCKET_BACKEND_GUIDE.md`**
- Hướng dẫn Backend implement
- Code examples
- Testing guide
- Troubleshooting

## 🔧 Files đã sửa

### `src/services/notificationService.js`
✅ Thêm import `websocketService`
✅ Thêm constant `USE_WEBSOCKET = true`
✅ Thêm method `initWebSocket()`
✅ Thêm method `initPolling()` (tách riêng)
✅ Thêm method `detectType()` (helper)
✅ Support cả WebSocket và Polling modes

## 🚀 Cách hoạt động

### Mode: WebSocket (Realtime) - Đang BẬT

```
1. User login
   ↓
2. notificationService.init() được gọi
   ↓
3. websocketService.connect() đến ws://localhost:8080/ws
   ↓
4. Subscribe to /topic/notifications/{buyerId}
   ↓
5. Admin approve seller
   ↓
6. Backend gửi WebSocket message
   ↓
7. Frontend nhận NGAY LẬP TỨC (< 1s) ⚡
   ↓
8. Popup hiển thị
```

### Mode: Polling (Fallback) - Auto-enabled nếu WebSocket fail

```
1. WebSocket connection failed
   ↓
2. Auto fallback to polling
   ↓
3. Poll API mỗi 10s
   ↓
4. Delay 0-10s
```

## ⚙️ Configuration

### Bật/Tắt WebSocket

File: `src/services/notificationService.js`

```javascript
const USE_WEBSOCKET = true; // ⭐ true = WebSocket, false = Polling
```

### WebSocket Settings

File: `src/services/websocketService.js`

```javascript
reconnectDelay: 5000,        // 5s giữa mỗi lần reconnect
maxReconnectAttempts: 5,     // Tối đa 5 lần
heartbeatIncoming: 4000,     // Heartbeat từ server
heartbeatOutgoing: 4000,     // Heartbeat đến server
```

## 📡 Topics Structure

### Personal Notifications (Current)
```
Topic: /topic/notifications/{buyerId}
Example: /topic/notifications/123
```

Frontend subscribe đến topic riêng của từng buyer.

### Broadcast (Future)
```
Topic: /topic/notifications/all
```

Nếu muốn gửi notification cho tất cả users.

## 🧪 Testing

### Frontend Console Logs

**Khi WebSocket hoạt động:**
```
🔔 [NotificationService] Initializing... Mode: WebSocket
🔌 [NotificationService] Starting WebSocket connection...
🔌 [WebSocket] Connecting to backend...
✅ [WebSocket] Connected!
📡 [WebSocket] Subscribing to /topic/notifications/123
✅ [WebSocket] Subscribed successfully
```

**Khi nhận notification:**
```
📬 [WebSocket] Received message: {...}
📬 [WebSocket] Parsed notification: {...}
📬 [NotificationService] Received WebSocket notification: {...}
```

**Khi WebSocket fail:**
```
❌ [WebSocket] Error: Connection failed
🔄 [NotificationService] Falling back to polling...
🔔 Starting notification polling...
```

### Backend cần gửi notification như thế nào?

```java
@Autowired
private SimpMessagingTemplate messagingTemplate;

// Khi approve seller
public void approveSeller(Long sellerId) {
    // ... update seller status ...
    
    // Tạo notification
    Notification notification = new Notification();
    notification.setReceiverId(seller.getBuyerId());
    notification.setTitle("Yêu cầu nâng cấp Seller đã được phê duyệt ✅");
    notification.setContent("Chúc mừng! Yêu cầu nâng cấp...");
    // ... set other fields ...
    
    notificationRepository.save(notification);
    
    // ⭐ GỬI QUA WEBSOCKET
    String topic = "/topic/notifications/" + seller.getBuyerId();
    messagingTemplate.convertAndSend(topic, notification);
}
```

## 📊 So sánh Before/After

### Before (Polling)
- ❌ Delay: 0-10 giây
- ❌ Network: Request mỗi 10s (waste bandwidth)
- ❌ Server load: Cao
- ✅ Simple implementation

### After (WebSocket)
- ✅ Delay: < 1 giây (realtime)
- ✅ Network: Chỉ khi có notification
- ✅ Server load: Thấp hơn
- ✅ Auto fallback to polling
- ✅ Better UX

## 🔄 Dependencies đã cài

```json
{
  "sockjs-client": "^1.6.1",
  "@stomp/stompjs": "^7.0.0"
}
```

Đã cài bằng:
```bash
npm install sockjs-client @stomp/stompjs
```

## ✅ Checklist

### Frontend (Done ✅)
- [x] Install dependencies
- [x] Create websocketService.js
- [x] Update notificationService.js
- [x] Support both WebSocket & Polling modes
- [x] Auto fallback mechanism
- [x] Documentation

### Backend (Pending ⏳)
- [ ] Inject SimpMessagingTemplate
- [ ] Send notification via WebSocket when approve seller
- [ ] Test với endpoint test
- [ ] Verify message format
- [ ] Deploy & test end-to-end

## 🎯 Next Steps

1. **Backend implement WebSocket send**
   - File: `WEBSOCKET_BACKEND_GUIDE.md`
   - Time: ~1 giờ

2. **Test end-to-end**
   - Admin approve seller
   - Buyer nhận notification < 1s
   - Verify popup, badge, navigation

3. **Deploy to staging**
   - Test với real users
   - Monitor WebSocket connections

## 🐛 Debug Commands

### Test WebSocket connection trong Console

```javascript
// Check WebSocket service
import websocketService from './src/services/websocketService.js';
console.log('Connected:', websocketService.isConnected());

// Manual connect
websocketService.connect(
  () => console.log('Connected!'),
  (err) => console.error('Error:', err)
);

// Manual disconnect
websocketService.disconnect();
```

### Force Polling mode

```javascript
// src/services/notificationService.js
const USE_WEBSOCKET = false; // Tắt WebSocket, dùng Polling
```

## 📞 Support

Nếu có vấn đề:
1. Check Console logs
2. Check Network tab (WS connections)
3. Verify Backend WebSocket endpoint hoạt động
4. Check `WEBSOCKET_BACKEND_GUIDE.md`

---

**Status:** 🟢 Frontend Complete - Waiting for Backend  
**Mode:** WebSocket (Realtime)  
**Fallback:** Polling (Auto)  
**Last Updated:** 2025-10-22

