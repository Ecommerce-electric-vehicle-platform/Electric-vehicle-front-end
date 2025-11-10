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
    this.processedNotificationIds = new Set(); // Track các notification đã xử lý
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
    // FIX: Chỉ notify nếu notification chưa được xử lý (tránh duplicate)
    const notificationId = notification.notificationId;
    
    if (!notificationId) {
      console.warn("[NotificationService] Notification missing ID, skipping");
      return;
    }
    
    if (this.processedNotificationIds.has(notificationId)) {
      console.log(`[NotificationService] Notification ${notificationId} already processed, skipping duplicate`);
      return;
    }
    
    // Đánh dấu đã xử lý
    this.processedNotificationIds.add(notificationId);
    
    // Giới hạn Set size để tránh memory leak (giữ tối đa 100 IDs)
    if (this.processedNotificationIds.size > 100) {
      const firstId = this.processedNotificationIds.values().next().value;
      this.processedNotificationIds.delete(firstId);
    }
    
    console.log(`[NotificationService] Notifying listeners about notification ${notificationId}`);
    this.listeners.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error("Error in notification listener:", error);
      }
    });
  }

  // Bắt đầu polling
  startPolling(resetLastId = false) {
    // ✅ FIX: Reset lastNotificationId khi user login lại (để hiển thị notification chưa đọc)
    if (resetLastId) {
      console.log("[NotificationService] Resetting lastNotificationId for new session");
      this.lastNotificationId = null;
    }
    
    if (this.pollingInterval) {
      // Nếu đang poll, vẫn poll ngay để lấy notification mới
      console.log("[NotificationService] Already polling, triggering immediate poll...");
      this.pollNotifications();
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
      const userRole = localStorage.getItem("userRole");
      const buyerId = localStorage.getItem("buyerId");
      
      console.log("[Notification] Auth check:", {
        hasToken: !!token,
        userRole,
        buyerId
      });
      
      // Chỉ poll khi user đã đăng nhập và không phải admin
      if (!token || userRole === "admin") {
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
        
        // FIX: Nếu lastNotificationId là null (lần đầu poll), hiển thị notification chưa đọc đầu tiên
        // Nếu không, chỉ hiển thị notification mới nhất chưa đọc
        const notificationsToCheck = this.lastNotificationId === null 
          ? notifications.filter(n => !n.readAt) // Lần đầu: lấy tất cả chưa đọc
          : [notifications[0]]; // Sau đó: chỉ lấy mới nhất
        
        for (const notification of notificationsToCheck) {
          console.log("[Notification] Checking notification:", {
            id: notification.notificationId,
            title: notification.title,
            isRead: !!notification.readAt,
            lastId: this.lastNotificationId
          });
          
          // FIX: Transform notification từ API format sang format Header component mong đợi
          const transformedNotification = {
            notificationId: notification.notificationId,
            title: notification.title || "Thông báo",
            message: notification.content || notification.message || "",
            type: this.detectType(notification.title, notification.content),
            isRead: !!notification.readAt,
            createdAt: notification.createdAt || notification.sendAt,
            receiverId: notification.receiverId
          };
          
          // FIX: Chỉ hiển thị notification mới nếu:
          // 1. ID khác với lần trước
          // 2. Chưa đọc (readAt là null/undefined/empty)
          // 3. Chưa được processed (tránh duplicate)
          const isUnread = !notification.readAt || 
                          notification.readAt === null || 
                          notification.readAt === undefined || 
                          notification.readAt === "";
          
          if (
            transformedNotification.notificationId !== this.lastNotificationId &&
            isUnread &&
            !this.processedNotificationIds.has(transformedNotification.notificationId)
          ) {
            console.log("[Notification] NEW NOTIFICATION! Showing popup...", transformedNotification);
            // Notify listeners về thông báo mới
            this.notify(transformedNotification);
            this.lastNotificationId = transformedNotification.notificationId;
            break; // Chỉ hiển thị một notification mỗi lần poll
          } else if (!isUnread) {
            console.log("[Notification] Notification đã đọc, bỏ qua:", {
              id: transformedNotification.notificationId,
              readAt: notification.readAt
            });
          }
        }
        
        if (notificationsToCheck.length === 0 || notificationsToCheck.every(n => n.readAt || n.notificationId === this.lastNotificationId)) {
          console.log("[Notification] No new notification (already seen or read)");
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
    
    // FIX: Reset processedNotificationIds khi init lại (để hiển thị notification chưa đọc)
    this.processedNotificationIds.clear();
    console.log("[NotificationService] Cleared processed notification IDs");
    
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
      const userRole = localStorage.getItem("userRole");
      
      if (token && userRole !== "admin") {
        console.log('🔌 [NotificationService] Starting WebSocket connection...');
        
        // FIX: Disconnect WebSocket cũ trước khi connect lại (tránh duplicate connections)
        websocketService.disconnect();
        
        // Subscribe to WebSocket notifications (phải subscribe TRƯỚC khi connect)
        const buyerId = localStorage.getItem('buyerId');
        const sellerId = localStorage.getItem('sellerId');
        const userId = buyerId || sellerId; // Support both buyer and seller
        
        if (userId) {
          const destination = `/queue/notifications/${userId}`;
          console.log(`[NotificationService] Will subscribe to: ${destination}`);
          
          // FIX: Subscribe listener TRƯỚC khi connect (để nhận notification ngay khi WebSocket connect)
          // websocketService.subscribeToNotifications() sẽ tự động subscribe đến STOMP topic
          // Chúng ta chỉ cần thêm listener để nhận notification
          websocketService.subscribe(destination, (notification) => {
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
              
              // Đánh dấu đây là notification real-time từ WebSocket
              isRealtime: true,
              realtimeReceivedAt: new Date().toISOString()
            };
            
            console.log('[NotificationService] ⚡ Real-time notification! Will display as "Vừa xong"');
            
            // Notify all listeners
            this.notify(transformedNotification);
          });
          
          // FIX: Connect WebSocket (subscribeToNotifications sẽ tự động được gọi trong onConnect)
          websocketService.connect(
            () => {
              console.log('[NotificationService] WebSocket connected! Ready to receive notifications...');
              this.websocketConnected = true;
              
              // FIX: Poll ngay một lần để lấy notification hiện có (chưa đọc)
              // WebSocket chỉ nhận notification mới, không lấy notification cũ
              console.log('[NotificationService] Polling once to get existing notifications...');
              this.lastNotificationId = null; // Reset để lấy tất cả notification chưa đọc
              this.pollNotifications(); // Poll ngay một lần
            },
            (error) => {
              console.error('[NotificationService] WebSocket error:', error);
              this.websocketConnected = false;
              
              // Fallback to polling if WebSocket fails
              console.log('[NotificationService] Falling back to polling...');
              this.startPolling(true); // Reset lastNotificationId khi fallback
            }
          );
        } else {
          console.warn('[NotificationService] No buyerId or sellerId found for WebSocket subscription');
          // Fallback to polling nếu không có userId
          this.startPolling(true);
        }
      } else {
        console.log('[NotificationService] Not starting WebSocket: No token or is admin');
        websocketService.disconnect();
        this.websocketConnected = false;
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
    // FIX: Mỗi lần init lại, luôn reset lastNotificationId để hiển thị notification chưa đọc
    this.lastNotificationId = null;
    console.log("[NotificationService] Reset lastNotificationId for new session");
    
    const checkAndStartPolling = () => {
      const token = localStorage.getItem("token");
      const userRole = localStorage.getItem("userRole");
      
      console.log("[NotificationService] Checking auth status:", { hasToken: !!token, userRole });
      
      if (token && userRole !== "admin") {
        console.log("[NotificationService] Starting polling immediately...");
        //FIX: Luôn reset lastNotificationId khi start polling (để hiển thị notification chưa đọc)
        this.startPolling(true); // Reset lastNotificationId
      } else {
        console.log("[NotificationService] Stopping polling (no token or is admin)");
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

