// src/components/NotificationPopup/NotificationPopup.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import "./NotificationPopup.css";

export function NotificationPopup({ notifications, onClose, onClick }) {
  const [visibleNotifications, setVisibleNotifications] = useState([]);

  useEffect(() => {
    // FIX: Chỉ hiển thị 1 notification mới nhất (đầu tiên trong array)
    if (notifications.length > 0) {
      // Chỉ lấy notification mới nhất
      setVisibleNotifications([notifications[0]]);
    } else {
      setVisibleNotifications([]);
    }
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

  const getRelativeTime = () => {
    // FIX: Tất cả notification đều hiển thị "Vừa xong" (real-time)
    return "Vừa xong";
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
              {getRelativeTime()}
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
