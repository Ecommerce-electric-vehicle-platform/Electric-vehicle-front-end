// src/components/NotificationList/NotificationList.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Bell,
} from "lucide-react";
import notificationApi from "../../api/notificationApi";
import "./NotificationList.css";

export function NotificationList({ isOpen, onClose, onNotificationClick }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const dropdownRef = useRef(null);
  const firstLoadTime = useRef(null); // Track thời gian load lần đầu

  // Load notifications khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      // Reset firstLoadTime mỗi khi mở dropdown
      firstLoadTime.current = new Date();
      loadNotifications(0);
    } else {
      // Reset khi đóng dropdown
      firstLoadTime.current = null;
    }
  }, [isOpen]);

  // Close dropdown khi click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadNotifications = async (pageNum) => {
    try {
      setLoading(true);
      const response = await notificationApi.getNotifications(pageNum, 20);
      const newNotifications = response?.data?.notifications || [];
      const totalPages = response?.data?.meta?.totalPages || 0;

      // Đánh dấu notifications chưa đọc là "mới" nếu được load trong vòng 2 phút
      // (Backend có thể gửi lại notification cũ với timestamp cũ, nhưng nếu chưa đọc
      // và được load ngay sau khi phê duyệt → coi như notification mới)
      const processedNotifications = newNotifications.map((notif, index) => {
        // Nếu notification chưa đọc và được load trong vòng 2 phút kể từ khi mở dropdown
        if (!notif.isRead && firstLoadTime.current) {
          const timeSinceFirstLoad = (new Date() - firstLoadTime.current) / 1000 / 60; // phút
          if (timeSinceFirstLoad < 2) {
            // Đặc biệt: notification đầu tiên (mới nhất) luôn được coi là "Vừa xong"
            if (pageNum === 0 && index === 0) {
              return {
                ...notif,
                isRealtime: true,
                realtimeReceivedAt: new Date().toISOString(), // Dùng thời gian hiện tại
              };
            }
            // Các notification khác: dùng thời gian load
            return {
              ...notif,
              isRealtime: true,
              realtimeReceivedAt: firstLoadTime.current.toISOString(),
            };
          }
        }
        return notif;
      });

      if (pageNum === 0) {
        setNotifications(processedNotifications);
      } else {
        setNotifications((prev) => [...prev, ...processedNotifications]);
      }

      setPage(pageNum);
      setHasMore(pageNum + 1 < totalPages);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      console.log("[NotificationList] Marking all notifications as read");
      
      // Gọi API để đánh dấu tất cả đã đọc
      await notificationApi.markAllAsRead();
      
      // FIX: Reload notifications để đảm bảo state sync với backend
      await loadNotifications(0);
      
      // FIX: Dispatch event sau khi reload để cập nhật badge
      // Đợi một chút để đảm bảo backend đã cập nhật
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("notificationRead"));
      }, 500);
    } catch (error) {
      console.error("Error marking all as read:", error);
      // Nếu lỗi, reload count từ backend
      window.dispatchEvent(new CustomEvent("notificationRead"));
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Đánh dấu đã đọc nếu chưa đọc
      if (!notification.isRead && !notification.readAt) {
        // Đánh dấu đã đọc trong state
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notification.notificationId
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n
          )
        );
        
        // Gọi API để đánh dấu đã đọc
        try {
          console.log("[NotificationList] Marking notification as read:", notification.notificationId);
          await notificationApi.markAsRead(notification.notificationId);
          console.log("[NotificationList] Mark as read successful");
          
          // FIX: Reload notifications để đảm bảo state sync với backend
          await loadNotifications(0);
          
          // FIX: Dispatch event sau khi reload để cập nhật badge
          // Đợi một chút để đảm bảo backend đã cập nhật
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("notificationRead"));
          }, 500);
        } catch (error) {
          console.error("Error marking notification as read:", error);
          // Nếu lỗi, rollback state
          setNotifications((prev) =>
            prev.map((n) =>
              n.notificationId === notification.notificationId
                ? { ...n, isRead: false, readAt: null }
                : n
            )
          );
          // Reload count từ backend
          window.dispatchEvent(new CustomEvent("notificationRead"));
        }
      }

      // Gọi callback từ parent
      if (onNotificationClick) {
        onNotificationClick(notification);
      }

      // Đóng dropdown
      onClose();
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle />;
      case "error":
        return <AlertCircle />;
      case "warning":
        return <AlertTriangle />;
      default:
        return <Info />;
    }
  };

  const getRelativeTime = () => {
    // ✅ FIX: Tất cả notification đều hiển thị "Vừa xong" (real-time)
    return "Vừa xong";
  };

  if (!isOpen) return null;

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <div className="notification-dropdown-header">
        <h3 className="notification-dropdown-title">Thông báo</h3>
        {notifications.some((n) => !n.isRead) && (
          <button
            className="notification-mark-all-read"
            onClick={handleMarkAllAsRead}
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      <div className="notification-dropdown-list">
        {loading && notifications.length === 0 ? (
          <div className="notification-loading">Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <div className="notification-empty-icon">
              <Bell />
            </div>
            <p className="notification-empty-text">Bạn chưa có thông báo nào</p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <div
                key={notification.notificationId}
                className={`notification-item ${
                  !notification.isRead ? "notification-unread" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div
                  className={`notification-item-icon icon-${
                    notification.type || "info"
                  }`}
                >
                  {getIcon(notification.type)}
                </div>
                <div className="notification-item-content">
                  <h4 className="notification-item-title">
                    {notification.title}
                  </h4>
                  <p className="notification-item-message">
                    {notification.message}
                  </p>
                  <div className="notification-item-time">
                    {getRelativeTime()}
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="notification-dropdown-footer">
                <button
                  className="notification-view-all"
                  onClick={() => loadNotifications(page + 1)}
                  disabled={loading}
                >
                  {loading ? "Đang tải..." : "Xem thêm"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
