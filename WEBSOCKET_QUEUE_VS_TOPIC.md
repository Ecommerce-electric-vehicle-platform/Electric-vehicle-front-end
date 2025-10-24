# 📡 WebSocket: `/queue/` vs `/topic/`

## 🎯 Tóm tắt nhanh

| Pattern | Destination | Use Case | Ai nhận? |
|---------|------------|----------|----------|
| **Point-to-Point** | `/queue/notifications/{buyerId}` | Personal notifications | CHỈ 1 user |
| **Publish-Subscribe** | `/topic/notifications/all` | Broadcast announcements | TẤT CẢ users |

---

## 📤 `/queue/` - Point-to-Point (1-to-1)

### Đặc điểm:
- Message gửi đến **1 người** cụ thể
- Nếu nhiều tab cùng subscribe → **chỉ 1 tab** nhận (load balancing)
- Semantic đúng cho personal messages

### Ví dụ:
```javascript
// Frontend subscribe
destination = `/queue/notifications/${buyerId}`;
stompClient.subscribe(destination, callback);
```

```java
// Backend send
String destination = "/queue/notifications/" + buyerId;
messagingTemplate.convertAndSend(destination, notification);
```

### Use cases:
✅ Personal notifications (seller approved)  
✅ Private messages  
✅ Order updates (cho 1 buyer)  
✅ Payment confirmations

---

## 📡 `/topic/` - Publish-Subscribe (1-to-many)

### Đặc điểm:
- Message broadcast đến **TẤT CẢ** subscribers
- Mọi tab cùng subscribe → **TẤT CẢ** đều nhận
- Semantic đúng cho public announcements

### Ví dụ:
```javascript
// Frontend subscribe
topic = `/topic/notifications/all`;
stompClient.subscribe(topic, callback);
```

```java
// Backend broadcast
String topic = "/topic/notifications/all";
messagingTemplate.convertAndSend(topic, announcement);
```

### Use cases:
✅ System announcements (maintenance)  
✅ Flash sales  
✅ Live updates (stock price)  
✅ Chat groups (nhiều người)

---

## ⚠️ Vấn đề nếu dùng SAI

### ❌ Dùng `/topic/` cho personal notification:

**Vấn đề 1: Security**
```
User A subscribe: /topic/notifications/123
User B subscribe: /topic/notifications/123 (nếu đoán được buyerId)
→ User B nhận được notification của User A!
```

**Vấn đề 2: Multiple tabs**
```
User A mở 3 tabs
→ 3 tabs đều subscribe /topic/notifications/123
→ 1 notification → 3 popups cùng lúc!
```

### ✅ Dùng `/queue/` cho personal notification:

**Giải quyết security:**
- Backend config đúng → user chỉ nhận message của mình

**Giải quyết multiple tabs:**
- STOMP load balancing → chỉ 1 tab nhận

---

## 🔧 Configuration

### Backend (Spring Boot):

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        
        // Enable BOTH /topic và /queue
        registry.enableSimpleBroker("/topic", "/queue");
        
        // Hoặc dùng external broker (RabbitMQ, ActiveMQ) cho production
        // registry.enableStompBrokerRelay("/topic", "/queue")
        //         .setRelayHost("localhost")
        //         .setRelayPort(61613);
    }
}
```

### Frontend:

```javascript
// Personal notifications
const buyerId = localStorage.getItem('buyerId');
const destination = `/queue/notifications/${buyerId}`;
stompClient.subscribe(destination, handlePersonalNotification);

// System announcements
const topic = `/topic/notifications/all`;
stompClient.subscribe(topic, handleSystemAnnouncement);
```

---

## 📊 So sánh chi tiết

| Feature | `/queue/` | `/topic/` |
|---------|----------|----------|
| **Số người nhận** | 1 | Nhiều |
| **Multiple tabs** | Load balancing | Tất cả nhận |
| **Security** | Cao (point-to-point) | Thấp (broadcast) |
| **Performance** | Tốt | Phụ thuộc số subscribers |
| **Use case** | Personal | Public |

---

## ✅ Best Practices

### 1. **Chọn đúng pattern:**
- Personal data → `/queue/`
- Public data → `/topic/`

### 2. **Naming convention:**
```
✅ GOOD:
/queue/notifications/{userId}
/queue/messages/{userId}
/topic/announcements/all
/topic/prices/stock/{symbol}

❌ BAD:
/topic/notifications/{userId}  // personal data không nên dùng topic
/queue/announcements/all       // broadcast không nên dùng queue
```

### 3. **Security:**
```java
// Validate user chỉ subscribe queue của mình
@MessageMapping("/subscribe")
public void handleSubscription(Principal principal, String destination) {
    String userId = principal.getName();
    if (!destination.equals("/queue/notifications/" + userId)) {
        throw new SecurityException("Unauthorized subscription");
    }
}
```

---

## 🧪 Testing

### Test Point-to-Point:
1. Mở 2 tabs với cùng user
2. Send notification
3. **Expected:** Chỉ 1 tab nhận

### Test Publish-Subscribe:
1. Mở 2 tabs với cùng user
2. Broadcast announcement
3. **Expected:** Cả 2 tabs đều nhận

---

## 📚 References

- [STOMP Protocol](https://stomp.github.io/)
- [Spring WebSocket Docs](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#websocket)
- [RabbitMQ STOMP](https://www.rabbitmq.com/stomp.html)

---

**Last Updated:** October 23, 2025  
**Status:** ✅ Implemented with `/queue/` for personal notifications

