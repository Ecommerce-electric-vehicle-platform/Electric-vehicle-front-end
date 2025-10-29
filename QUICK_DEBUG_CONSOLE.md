# 🔍 Quick Debug - Check Console Logs

## Bước 1: Mở Console

1. Trong DevTools, click tab **Console** (bên cạnh Network)
2. Scroll lên để xem logs từ lúc bạn login

## Bước 2: Tìm WebSocket Logs

### ✅ Nếu WebSocket Connected, bạn sẽ thấy:

```
🔌 [WebSocket] 🔄 Connecting to backend http://localhost:8080/ws ...
[WebSocket Debug]: ...
✅ [WebSocket] 🎉 Successfully connected to Backend!
📡 [WebSocket] Connection details: { backend: "...", protocol: "STOMP over SockJS", time: "..." }
📡 [WebSocket] Subscribing to queue: /queue/notifications/123
✅ [WebSocket] 🎧 Successfully subscribed to notifications!
```

### ❌ Nếu WebSocket Failed, bạn sẽ thấy:

```
❌ [WebSocket] WebSocket Error: ...
❌ [WebSocket] STOMP Error: ...
🔄 [NotificationService] Falling back to polling...
```

### 🔔 Khi Admin Approve, phải thấy:

```
🔔 [WebSocket] 📩 New notification received from Backend!
📋 [WebSocket] Notification data: {...}
[NotificationService] Received WebSocket notification: {...}
[NotificationService] ⚡ Real-time notification! Will display as "Vừa xong"
New notification: {...}
```

## Bước 3: Check Network Tab - WS

1. Trong Network tab, click filter **WS** (WebSocket)
2. Phải thấy connection đến: `ws://localhost:8080/ws/...`
3. Status: `101 Switching Protocols`

**Nếu KHÔNG thấy connection:**
→ WebSocket chưa connect
→ Backend có thể chưa chạy hoặc chưa config WebSocket

## Bước 4: Check buyerId

Trong Console, chạy:

```javascript
console.log('Buyer ID:', localStorage.getItem('buyerId'));
console.log('Token:', localStorage.getItem('token') ? 'Exists' : 'Missing');
```

Phải có buyerId và token!

---

## 🎯 Các Kịch Bản

### Scenario 1: WebSocket Connected + Không Nhận Notification

**Console logs:**
```
✅ WebSocket connected
✅ Subscribed to /queue/notifications/123
❌ KHÔNG có "New notification received"
```

**Nguyên nhân:** Backend KHÔNG gửi WebSocket message

**Giải pháp:** Backend cần thêm code:

```java
// Khi approve seller
String destination = "/queue/notifications/" + buyerId;
messagingTemplate.convertAndSend(destination, notification);
System.out.println("📤 Sent WebSocket to: " + destination);
```

---

### Scenario 2: WebSocket KHÔNG Connected

**Console logs:**
```
❌ [WebSocket] Error
❌ STOMP Error
🔄 Falling back to polling...
```

**Nguyên nhân:** 
- Backend chưa chạy
- WebSocket endpoint chưa enable
- CORS issue

**Giải pháp:** Check Backend:

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
```

---

### Scenario 3: buyerId Missing

**Console logs:**
```
⚠️ [WebSocket] Cannot subscribe: No buyerId in localStorage
```

**Nguyên nhân:** Login response không trả buyerId

**Giải pháp:** Check login response có chứa buyerId không

---

## 🧪 Test Script

Copy vào Console:

```javascript
// Full diagnostic
console.log('\n╔═════════════════════════════════════╗');
console.log('║  🔍 WEBSOCKET DEBUG INFO           ║');
console.log('╚═════════════════════════════════════╝\n');

const buyerId = localStorage.getItem('buyerId');
const sellerId = localStorage.getItem('sellerId');
const token = localStorage.getItem('token');
const userRole = localStorage.getItem('userRole');

console.log('1️⃣ Auth Status:');
console.log('   Buyer ID:', buyerId || '❌ Missing');
console.log('   Seller ID:', sellerId || 'N/A');
console.log('   Token:', token ? '✅ Exists' : '❌ Missing');
console.log('   Role:', userRole || 'N/A');

console.log('\n2️⃣ WebSocket Destination:');
const userId = buyerId || sellerId;
console.log('   Expected:', `/queue/notifications/${userId}`);

console.log('\n3️⃣ Check Above for WebSocket Logs:');
console.log('   Look for: "✅ [WebSocket] Successfully connected"');
console.log('   Look for: "📡 [WebSocket] Subscribing to queue"');
console.log('   Look for: "✅ [WebSocket] Successfully subscribed"');

console.log('\n4️⃣ When Admin Approves:');
console.log('   Should see: "🔔 [WebSocket] New notification received"');
console.log('   Should see: Popup appear on screen');

console.log('\n💡 Next Step:');
if (!buyerId && !sellerId) {
    console.log('   ❌ No buyerId/sellerId! Re-login and check response.');
} else if (!token) {
    console.log('   ❌ No token! Please login.');
} else {
    console.log('   ✅ Auth OK. Check for WebSocket connection logs above.');
    console.log('   📍 If no WebSocket logs, check Backend is running.');
}
```

---

## 📸 Screenshot Cần Gửi

Để tôi debug, hãy gửi screenshot của:

1. **Console tab** - Toàn bộ logs từ lúc login
2. **Network tab (WS filter)** - WebSocket connections
3. **Backend logs** - Khi admin click approve

---

## 🎯 Next Steps

Hãy:
1. ✅ Mở Console tab
2. ✅ Scroll lên xem logs
3. ✅ Copy tất cả logs liên quan đến WebSocket
4. ✅ Gửi cho tôi

Hoặc chạy test script ở trên và gửi kết quả!


