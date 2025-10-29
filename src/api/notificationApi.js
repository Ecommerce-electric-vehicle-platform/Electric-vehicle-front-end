// src/api/notificationApi.js
import axiosInstance from "./axiosInstance";

const notificationApi = {
  // Lấy danh sách thông báo
  // GET /api/v1/notifications
  getNotifications: async (page = 0, size = 20) => {
    try {
      console.log("[API] Calling GET /api/v1/notifications", { page, size });
      
      const res = await axiosInstance.get("/api/v1/notifications", {
        params: { page, size },
      });
      
      console.log("[API] Raw response from backend:", res.data);
      
      // Backend trả về array trực tiếp trong data
      // Normalize response để match với component
      const notifications = Array.isArray(res.data) ? res.data : [];
      console.log("[API] Parsed notifications array:", notifications);
      
      // Transform backend format sang frontend format
      const transformedNotifications = notifications.map(notif => {
        const transformed = {
          notificationId: notif.notificationId,
          title: notif.title || "Thông báo",
          message: notif.content || "", // Backend dùng 'content'
          type: detectNotificationType(notif.title, notif.content), // Tự động detect type
          isRead: !!notif.readAt, // Nếu có readAt thì đã đọc
          createdAt: notif.createdAt || notif.sendAt,
          receiverId: notif.receiverId,
        };
        
        console.log("[API] Transformed notification:", {
          original: notif,
          transformed
        });
        
        return transformed;
      });

      const result = {
        data: {
          notifications: transformedNotifications,
          meta: {
            totalPages: Math.ceil(notifications.length / size) || 1,
            currentPage: page,
          }
        }
      };
      
      console.log("[API] Final result:", result);
      return result;
    } catch (error) {
      console.error("[API] Lỗi khi lấy danh sách thông báo:", error);
      throw error;
    }
  },

  //=====================PHẦN MỞ RỘNG =========================
  // Lấy số lượng thông báo chưa đọc
  // Backend không có endpoint riêng, ta tính từ getNotifications
  getUnreadCount: async () => {
    try {
      const res = await axiosInstance.get("/api/v1/notifications");
      const notifications = Array.isArray(res.data) ? res.data : [];
      const unreadCount = notifications.filter(n => !n.readAt).length;
      
      return {
        data: {
          unreadCount
        }
      };
    } catch (error) {
      console.error("Lỗi khi lấy số thông báo chưa đọc:", error);
      // Nếu lỗi thì return 0
      return { data: { unreadCount: 0 } };
    }
  },

  // Đánh dấu một thông báo đã đọc
  // PUT /api/v1/notifications/{notificationId}/read
  markAsRead: async (notificationId) => {
    try {
      const res = await axiosInstance.put(
        `/api/v1/notifications/${notificationId}/read`
      );
      return res.data;
    } catch (error) {
      console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
      throw error;
    }
  },

  //=====================PHẦN MỞ RỘNG =========================
  // Đánh dấu tất cả thông báo đã đọc
  // Backend chưa có endpoint này, ta gọi markAsRead cho từng notification
  markAllAsRead: async () => {
    try {
      // Lấy tất cả notifications chưa đọc
      const res = await axiosInstance.get("/api/v1/notifications");
      const notifications = Array.isArray(res.data) ? res.data : [];
      const unreadNotifications = notifications.filter(n => !n.readAt);
      
      // Đánh dấu đã đọc từng cái
      const promises = unreadNotifications.map(n => 
        axiosInstance.put(`/api/v1/notifications/${n.notificationId}/read`)
      );
      
      await Promise.all(promises);
      return { message: "Đã đánh dấu tất cả thông báo đã đọc" };
    } catch (error) {
      console.error("Lỗi khi đánh dấu tất cả thông báo đã đọc:", error);
      throw error;
    }
  },


  //============PHẦN NÀY BE CHƯA CÓ, GIẢ ĐỊNH THÔI ============
  // Xóa thông báo (backend chưa có API này)
  // eslint-disable-next-line no-unused-vars
  deleteNotification: async (notificationId) => {
    try {
      // Backend chưa có endpoint delete, có thể implement sau
      console.warn("Delete notification API chưa được backend hỗ trợ");
      return { message: "Chức năng đang phát triển" };
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
      throw error;
    }
  },

  // Tạo notification mới (Admin/System dùng)
  // POST /api/v1/notifications/new-notification
  createNotification: async (data) => {
    try {
      const res = await axiosInstance.post("/api/v1/notifications/new-notification", {
        notificationId: data.notificationId || 0,
        receiverId: data.receiverId,
        type: "BUYER", // Backend chỉ hỗ trợ type BUYER
        title: data.title,
        content: data.content,
        sendAt: data.sendAt || new Date().toISOString(),
        readAt: data.readAt || null,
        createdAt: data.createdAt || new Date().toISOString(),
      });
      return res.data;
    } catch (error) {
      console.error("Lỗi khi tạo thông báo:", error);
      throw error;
    }
  },
};

// Helper function để tự động detect notification type từ nội dung
function detectNotificationType(title = "", content = "") {
  const text = (title + " " + content).toLowerCase();
  
  // Success keywords
  const successKeywords = [
    "phê duyệt", "thành công", "hoàn thành", "chấp nhận", 
    "approved", "success", "completed", "accepted"
  ];
  
  // Error keywords
  const errorKeywords = [
    "từ chối", "thất bại", "lỗi", "hủy", "rejected", 
    "failed", "error", "cancelled", "denied"
  ];
  
  // Warning keywords
  const warningKeywords = [
    "cảnh báo", "chú ý", "lưu ý", "warning", 
    "attention", "notice", "pending"
  ];
  
  // Check for each type
  if (successKeywords.some(keyword => text.includes(keyword))) {
    return "success";
  }
  
  if (errorKeywords.some(keyword => text.includes(keyword))) {
    return "error";
  }
  
  if (warningKeywords.some(keyword => text.includes(keyword))) {
    return "warning";
  }
  
  // Default to info
  return "info";
}

export default notificationApi;

