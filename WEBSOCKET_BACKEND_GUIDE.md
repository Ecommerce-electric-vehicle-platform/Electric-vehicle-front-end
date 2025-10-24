# WebSocket Backend Integration Guide

## Backend đã có WebSocketConfig

Config hiện tại:
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

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic", "/queue");
    }
}
```

## 📡 Frontend đã kết nối

Frontend sẽ:
1. Connect đến: `http://localhost:8080/ws`
2. Subscribe đến: `/queue/notifications/{buyerId}` ⭐ (point-to-point)
3. Nhận notification realtime ngay lập tức

## Backend cần làm gì?

### 1. Inject SimpMessagingTemplate

```java
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
public class NotificationService {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    // ... other code
}
```

### 2. Gửi notification khi approve seller

```java
@Service
public class SellerService {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @Autowired
    private NotificationRepository notificationRepository;
    
    public void approveSeller(Long sellerId, String decision) {
        // 1. Update seller status
        Seller seller = sellerRepository.findById(sellerId).orElseThrow();
        seller.setStatus("APPROVED");
        sellerRepository.save(seller);
        
        // 2. Tạo notification trong DB
        Notification notification = new Notification();
        notification.setReceiverId(seller.getBuyerId());
        notification.setType("BUYER");
        notification.setTitle("Yêu cầu nâng cấp Seller đã được phê duyệt");
        notification.setContent("Chúc mừng! Yêu cầu nâng cấp lên Seller của bạn đã được phê duyệt. Vui lòng mua gói Seller để kích hoạt.");
        notification.setSendAt(LocalDateTime.now());
        notification.setReadAt(null);
        notification.setCreatedAt(LocalDateTime.now());
        
        notificationRepository.save(notification);
        
        // 3. GỬI QUA WEBSOCKET NGAY LẬP TỨC
        String destination = "/queue/notifications/" + seller.getBuyerId();
        messagingTemplate.convertAndSend(destination, notification);
        
        System.out.println("📤 [WebSocket] Sent notification to: " + destination);
    }
}
```

## Message Format

Backend gửi notification với format:

```json
{
  "notificationId": 123,
  "receiverId": 456,
  "type": "BUYER",
  "title": "Yêu cầu nâng cấp Seller đã được phê duyệt ",
  "content": "Chúc mừng! Yêu cầu nâng cấp...",
  "sendAt": "2025-10-22T10:00:00",
  "readAt": null,
  "createdAt": "2025-10-22T10:00:00"
}
```

Frontend sẽ tự động:
- ✅ Nhận notification NGAY LẬP TỨC (không cần đợi 10s)
- ✅ Hiển thị popup toast
- ✅ Cập nhật badge count
- ✅ Auto-detect type (success/error/warning/info)

## 🎯 Topics cho các loại notification

### 1. Personal Notifications (Recommended)
```java
// Gửi cho một buyer cụ thể
String destination = "/queue/notifications/" + buyerId;
messagingTemplate.convertAndSend(topic, notification);
```

### 2. Broadcast Notifications (Optional)
```java
// Gửi cho tất cả users
String topic = "/topic/notifications/all";
messagingTemplate.convertAndSend(topic, notification);
```

### 3. Queue (Private) - Alternative
```java
// Gửi riêng cho một user
String queue = "/queue/notifications/" + buyerId;
messagingTemplate.convertAndSendToUser(
    String.valueOf(buyerId), 
    "/queue/notifications", 
    notification
);
```

## 🔐 Authentication (Optional nhưng recommended)

### Thêm Authentication vào WebSocket:

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new CustomHandshakeHandler())
                .addInterceptors(new HttpSessionHandshakeInterceptor())
                .withSockJS();
    }
    
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = 
                    MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                    
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    
                    if (authToken != null && authToken.startsWith("Bearer ")) {
                        String token = authToken.substring(7);
                        
                        if (jwtTokenProvider.validateToken(token)) {
                            String username = jwtTokenProvider.getUsernameFromToken(token);
                            UsernamePasswordAuthenticationToken auth = 
                                new UsernamePasswordAuthenticationToken(
                                    username, null, new ArrayList<>()
                                );
                            accessor.setUser(auth);
                        }
                    }
                }
                
                return message;
            }
        });
    }
}
```

## 🧪 Testing

### Test 1: Manual send với Controller

Tạo test endpoint để gửi notification thử:

```java
@RestController
@RequestMapping("/api/v1/test")
public class TestController {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @PostMapping("/send-notification/{buyerId}")
    public ResponseEntity<?> sendTestNotification(@PathVariable Long buyerId) {
        Map<String, Object> notification = new HashMap<>();
        notification.put("notificationId", System.currentTimeMillis());
        notification.put("receiverId", buyerId);
        notification.put("type", "BUYER");
        notification.put("title", "TEST - Thông báo test");
        notification.put("content", "Đây là notification test qua WebSocket");
        notification.put("sendAt", LocalDateTime.now());
        notification.put("readAt", null);
        notification.put("createdAt", LocalDateTime.now());
        
        String destination = "/queue/notifications/" + buyerId;
        messagingTemplate.convertAndSend(topic, notification);
        
        return ResponseEntity.ok("Sent to topic: " + topic);
    }
}
```

**Test:**
```bash
POST http://localhost:8080/api/v1/test/send-notification/123
```

Frontend sẽ nhận ngay lập tức!

### Test 2: Check WebSocket connection

Frontend console sẽ hiển thị:
```
🔌 [WebSocket] Connecting to backend...
✅ [WebSocket] Connected!
📡 [WebSocket] Subscribing to queue: /queue/notifications/123
✅ [WebSocket] Subscribed successfully
📬 [WebSocket] Received message: {...}
```

## 🔄 Flow hoàn chỉnh

```
1. Admin click "Phê duyệt" trong Admin Dashboard
   ↓
2. Frontend gọi API: POST /api/v1/admin/approve-seller
   ↓
3. Backend xử lý:
   a. Update seller status ✅
   b. Tạo notification trong DB ✅
   c. ⭐ GỬI QUA WEBSOCKET: messagingTemplate.convertAndSend(...)
   ↓
4. Frontend nhận NGAY LẬP TỨC (< 1s)
   ↓
5. Popup hiển thị ✅
   ↓
6. Badge count tăng ✅
```

## 📊 So sánh Polling vs WebSocket

| Feature | Polling (10s) | WebSocket (Realtime) |
|---------|--------------|---------------------|
| Độ trễ | 0-10s | < 1s |
| Network load | Cao (request mỗi 10s) | Thấp (chỉ khi có data) |
| Server load | Cao | Thấp |
| Realtime | ❌ | ✅ |
| Fallback | N/A | Auto fallback to polling |

## ✅ Checklist cho Backend

- [ ] Inject `SimpMessagingTemplate`
- [ ] Gửi notification qua WebSocket khi approve seller
- [ ] Test với endpoint test trước
- [ ] Đảm bảo format message đúng
- [ ] (Optional) Thêm authentication
- [ ] (Optional) Log để debug

## 🎯 Expected Result

Sau khi implement:

1. ✅ Admin approve → Backend gửi WebSocket
2. ✅ Buyer nhận popup NGAY LẬP TỨC (< 1s)
3. ✅ Badge count cập nhật realtime
4. ✅ Click notification → Navigate đến page

**Không còn delay 10s nữa!** ⚡

## 🐛 Troubleshooting

### Frontend không nhận notification?

**Check:**
1. Console có log "✅ [WebSocket] Connected!" không?
2. Console có log "📡 [WebSocket] Subscribing to queue: /queue/notifications/{buyerId}" không?
3. buyerId đúng không?

**Backend:**
1. Check destination đúng format: `/queue/notifications/{buyerId}`
2. Check `messagingTemplate.convertAndSend()` được gọi
3. Check logs có lỗi không

### WebSocket không connect?

**Frontend fallback to polling:**
```
❌ [WebSocket] Error
🔄 [NotificationService] Falling back to polling...
```

**Check Backend:**
1. WebSocket endpoint `/ws` có hoạt động không?
2. CORS đã enable chưa?
3. SockJS có hoạt động không?

## 📞 Contact

Nếu cần hỗ trợ, ping Frontend Team.

---

**Status:** 🟢 Frontend ready - Chờ Backend implement  
**Priority:** High  
**Impact:** Realtime notification instead of 10s delay

