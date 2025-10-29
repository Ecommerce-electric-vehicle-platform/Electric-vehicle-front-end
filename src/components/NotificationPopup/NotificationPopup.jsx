// src/components/NotificationPopup/NotificationPopup.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import "./NotificationPopup.css";

export function NotificationPopup({ notifications, onClose, onClick }) {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    setVisibleNotifications(notifications);
  }, [notifications]);

  const handleClose = (notificationId, e) => {
    e.stopPropagation();

    // Thêm class exit animation
    setVisibleNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === notificationId ? { ...n, exiting: true } : n
      )
    );

    // Sau animation xong thì remove
    setTimeout(() => {
      onClose(notificationId);
    }, 300);
  };

  const handleClick = (notification) => {
    onClick(notification);
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

  const getRelativeTime = (notification) => {
    // ⭐ Ưu tiên: Nếu là real-time notification từ WebSocket
    if (notification.isRealtime && notification.realtimeReceivedAt) {
      const now = new Date();
      const receivedTime = new Date(notification.realtimeReceivedAt);
      const diffMs = now - receivedTime;
      const diffSecs = Math.floor(diffMs / 1000);

      // Trong vòng 60 giây → "Vừa xong"
      if (diffSecs < 60) return "Vừa xong";

      // 1-59 phút → "X phút trước"
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins} phút trước`;

      // Sau 1 giờ → fallback to timestamp
    }

    // Fallback: Dùng timestamp gốc
    const timestamp = notification.createdAt;
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

  if (visibleNotifications.length === 0) return null;

  return createPortal(
    <div className="notification-popup-container">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.notificationId}
          className={`notification-popup notification-${
            notification.type || "info"
          } ${notification.exiting ? "notification-exit" : ""}`}
          onClick={() => handleClick(notification)}
        >
          <div
            className={`notification-popup-icon icon-${
              notification.type || "info"
            }`}
          >
            {getIcon(notification.type)}
          </div>
          <div className="notification-popup-content">
            <h4 className="notification-popup-title">{notification.title}</h4>
            <p className="notification-popup-message">{notification.message}</p>
            <div className="notification-popup-time">
              {getRelativeTime(notification)}
            </div>
          </div>
          <button
            className="notification-popup-close"
            onClick={(e) => handleClose(notification.notificationId, e)}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
