// src/services/notificationService.js
import notificationApi from "../api/notificationApi";
import websocketService from "./websocketService";

// MODE: WebSocket hoặc Polling
const USE_WEBSOCKET = true; // true = WebSocket (realtime), false = Polling (10s)

class NotificationService {
  constructor() {
    this.listeners = [];
    this.pollingInterval = null;
    this.pollingDelay = 10000; // Poll mỗi 10 giây
    this.lastNotificationId = null;
    this.websocketConnected = false;
  }

  // Đăng ký listener để nhận thông báo mới
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  // Thông báo cho tất cả listeners
  notify(notification) {
    this.listeners.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error("Error in notification listener:", error);
      }
    });
  }

  // Bắt đầu polling
  startPolling() {
    if (this.pollingInterval) {
      return; // Đã đang poll rồi
    }

    console.log("Starting notification polling...");
    
    // Poll ngay lập tức
    this.pollNotifications();

    // Sau đó poll định kỳ
    this.pollingInterval = setInterval(() => {
      this.pollNotifications();
    }, this.pollingDelay);
  }

  // Dừng polling
  stopPolling() {
    if (this.pollingInterval) {
      console.log("Stopping notification polling...");
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Poll thông báo mới
  async pollNotifications() {
    console.log("[Notification] Polling notifications...");
    
    try {
      const token = localStorage.getItem("token");
      const authType = localStorage.getItem("authType");
      const buyerId = localStorage.getItem("buyerId");
      
      console.log("[Notification] Auth check:", {
        hasToken: !!token,
        authType,
        buyerId
      });
      
      // Chỉ poll khi user đã đăng nhập và không phải admin
      if (!token || authType === "admin") {
        console.log("[Notification] Polling stopped: No token or is admin");
        return;
      }

      // Lấy thông báo mới nhất (chỉ lấy 5 cái)
      const response = await notificationApi.getNotifications(0, 5);
      console.log("[Notification] API Response:", response);
      
      const notifications = response?.data?.notifications || [];
      console.log("[Notification] Notifications count:", notifications.length);

      if (notifications.length > 0) {
        console.log("[Notification] Notifications:", notifications);
        
        const latestNotification = notifications[0];
        console.log(" [Notification] Latest notification:", {
          id: latestNotification.notificationId,
          title: latestNotification.title,
          isRead: latestNotification.isRead,
          lastId: this.lastNotificationId
        });
        
        // Nếu có thông báo mới (ID khác với lần trước)
        if (
          latestNotification.notificationId !== this.lastNotificationId &&
          !latestNotification.isRead
        ) {
          console.log("[Notification] NEW NOTIFICATION! Showing popup...");
          // Notify listeners về thông báo mới
          this.notify(latestNotification);
          this.lastNotificationId = latestNotification.notificationId;
        } else {
          console.log("Notification] No new notification (already seen or read)");
        }
      } else {
        console.log("[Notification] No notifications found");
      }
    } catch (error) {
      // Nếu lỗi 401, có thể token hết hạn
      if (error.response?.status === 401) {
        console.log("[Notification] Token expired, stopping polling");
        this.stopPolling();
      }
      console.error("[Notification] Polling error:", error);
    }
  }

  // Khởi tạo service (gọi khi app start)
  init() {
    console.log(`[NotificationService] Initializing... Mode: ${USE_WEBSOCKET ? 'WebSocket' : 'Polling'}`);
    
    if (USE_WEBSOCKET) {
      // Mode: WebSocket (Realtime)
      this.initWebSocket();
    } else {
      // Mode: Polling (10s interval)
      this.initPolling();
    }
  }

  // Khởi tạo WebSocket mode
  initWebSocket() {
    const checkAndConnectWebSocket = () => {
      const token = localStorage.getItem("token");
      const authType = localStorage.getItem("authType");
      
      if (token && authType !== "admin") {
        console.log('🔌 [NotificationService] Starting WebSocket connection...');
        
        // Connect WebSocket
        websocketService.connect(
          () => {
            console.log('[NotificationService] WebSocket connected!');
            this.websocketConnected = true;
          },
          (error) => {
            console.error('[NotificationService] WebSocket error:', error);
            this.websocketConnected = false;
            
            // Fallback to polling if WebSocket fails
            console.log('[NotificationService] Falling back to polling...');
            this.startPolling();
          }
        );

        // Subscribe to WebSocket notifications
        const buyerId = localStorage.getItem('buyerId');
        if (buyerId) {
          const topic = `/topic/notifications/${buyerId}`;
          
          websocketService.subscribe(topic, (notification) => {
            console.log('[NotificationService] Received WebSocket notification:', notification);
            
            // Transform notification từ backend
            const transformedNotification = {
              notificationId: notification.notificationId,
              title: notification.title || "Thông báo",
              message: notification.content || "",
              type: this.detectType(notification.title, notification.content),
              isRead: !!notification.readAt,
              createdAt: notification.createdAt || notification.sendAt,
              receiverId: notification.receiverId,
            };
            
            // Notify all listeners
            this.notify(transformedNotification);
          });
        }
      } else {
        console.log('[NotificationService] Not starting WebSocket: No token or is admin');
        websocketService.disconnect();
      }
    };

    // Check ngay
    checkAndConnectWebSocket();

    // Listen cho auth changes
    window.addEventListener("authStatusChanged", checkAndConnectWebSocket);

    // Cleanup khi tắt tab
    window.addEventListener("beforeunload", () => {
      websocketService.disconnect();
    });
  }

  // Khởi tạo Polling mode
  initPolling() {
    const checkAndStartPolling = () => {
      const token = localStorage.getItem("token");
      const authType = localStorage.getItem("authType");
      
      if (token && authType !== "admin") {
        this.startPolling();
      } else {
        this.stopPolling();
      }
    };

    // Check ngay
    checkAndStartPolling();

    // Listen cho auth changes
    window.addEventListener("authStatusChanged", checkAndStartPolling);

    // Cleanup khi tắt tab
    window.addEventListener("beforeunload", () => {
      this.stopPolling();
    });
  }

  // Helper: Detect notification type
  detectType(title = "", content = "") {
    const text = (title + " " + content).toLowerCase();
    
    const successKeywords = [
      "phê duyệt", "thành công", "hoàn thành", "chấp nhận", 
      "approved", "success", "completed", "accepted"
    ];
    
    const errorKeywords = [
      "từ chối", "thất bại", "lỗi", "hủy", "rejected", 
      "failed", "error", "cancelled", "denied"
    ];
    
    const warningKeywords = [
      "cảnh báo", "chú ý", "lưu ý", "warning", 
      "attention", "notice", "pending"
    ];
    
    if (successKeywords.some(keyword => text.includes(keyword))) {
      return "success";
    }
    
    if (errorKeywords.some(keyword => text.includes(keyword))) {
      return "error";
    }
    
    if (warningKeywords.some(keyword => text.includes(keyword))) {
      return "warning";
    }
    
    return "info";
  }
}

// Singleton instance
const notificationService = new NotificationService();
export default notificationService;

