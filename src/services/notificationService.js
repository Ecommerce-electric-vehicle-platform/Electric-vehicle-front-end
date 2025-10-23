// src/services/notificationService.js
import notificationApi from "../api/notificationApi";

class NotificationService {
  constructor() {
    this.listeners = [];
    this.pollingInterval = null;
    this.pollingDelay = 10000; // Poll mỗi 10 giây
    this.lastNotificationId = null;
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
    // Kiểm tra auth status
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
}

// Singleton instance
const notificationService = new NotificationService();
export default notificationService;

