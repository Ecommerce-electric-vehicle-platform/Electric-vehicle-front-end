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

  // Load notifications khi mở dropdown
  useEffect(() => {
    if (isOpen) {
      loadNotifications(0);
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

      if (pageNum === 0) {
        setNotifications(newNotifications);
      } else {
        setNotifications((prev) => [...prev, ...newNotifications]);
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
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      // Dispatch event để cập nhật badge
      window.dispatchEvent(new CustomEvent("notificationRead"));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // Đánh dấu đã đọc nếu chưa đọc
      if (!notification.isRead) {
        await notificationApi.markAsRead(notification.notificationId);
        setNotifications((prev) =>
          prev.map((n) =>
            n.notificationId === notification.notificationId
              ? { ...n, isRead: true }
              : n
          )
        );
        // Dispatch event để cập nhật badge
        window.dispatchEvent(new CustomEvent("notificationRead"));
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

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return "Vừa xong";

    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày trước`;
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
                    {getRelativeTime(notification.createdAt)}
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
