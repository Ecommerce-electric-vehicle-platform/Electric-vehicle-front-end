import React, { useState } from "react";
import {
  Bell,
  X,
  Package,
  ShoppingCart,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Eye,
  Menu,
} from "lucide-react";
import "./SellerNotification.css";

function SellerNotification({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onViewOrder,
}) {
  const [activeTab, setActiveTab] = useState("all");

  const formatCurrency = (value) => {
    return value.toLocaleString("vi-VN") + " ₫";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Nếu là trong 7 ngày qua, hiển thị "X ngày trước"
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes <= 1 ? "Vừa xong" : `${diffMinutes} phút trước`;
      }
      return diffHours === 1 ? "1 giờ trước" : `${diffHours} giờ trước`;
    }

    if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    }

    // Nếu quá 7 ngày, hiển thị "Thứ X, DD/MM"
    const daysOfWeek = [
      "Chủ nhật",
      "Thứ 2",
      "Thứ 3",
      "Thứ 4",
      "Thứ 5",
      "Thứ 6",
      "Thứ 7",
    ];
    const dayOfWeek = daysOfWeek[date.getDay()];
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${dayOfWeek}, ${day}/${month}`;
  };

  // Hàm để highlight các từ khóa trong message
  const highlightMessage = (message) => {
    if (!message) return { __html: "" };

    // Tìm các pattern như tên sản phẩm, quy định, v.v.
    // Ví dụ: "Tin Xe máy Angel Power đã qua sử dụng..." -> highlight "Xe máy Angel Power đã qua sử dụng"
    // Hoặc "Quy Định Đăng Tin của Chợ Tốt" -> highlight

    // Pattern để tìm tên sản phẩm (thường bắt đầu bằng "Tin " và kết thúc trước các từ khóa như "đã", "chưa", "được")
    let highlightedMessage = message;

    // Highlight các cụm từ quan trọng (có thể mở rộng logic này)
    const patterns = [
      {
        // Tên sản phẩm sau "Tin "
        regex: /Tin\s+([^đ]+?)(?=\s+(?:đã|chưa|được|do))/gi,
        replace: (match, p1) =>
          `Tin <span class="highlighted-text">${p1.trim()}</span>`,
      },
      {
        // "Quy Định Đăng Tin của Chợ Tốt"
        regex: /(Quy Định Đăng Tin của Chợ Tốt)/gi,
        replace: (match) => `<span class="highlighted-text">${match}</span>`,
      },
    ];

    patterns.forEach(({ regex, replace }) => {
      highlightedMessage = highlightedMessage.replace(regex, replace);
    });

    return { __html: highlightedMessage };
  };

  const getNotificationIcon = () => {
    // Icon vàng như trong hình với symbol menu/list
    return (
      <div className="notification-icon-yellow">
        <Menu size={16} className="notification-icon-symbol" />
      </div>
    );
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    return notification.type === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div
      className={`seller-notification-overlay ${isOpen ? "open" : ""}`}
      onClick={onClose}
    >
      <div
        className="seller-notification-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notification-header">
          <div className="header-left">
            <Bell size={24} />
            <h2>Thông báo</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="notification-tabs">
          <button
            className={`tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            className={`tab ${activeTab === "unread" ? "active" : ""}`}
            onClick={() => setActiveTab("unread")}
          >
            Chưa đọc ({unreadCount})
          </button>
          <button
            className={`tab ${activeTab === "new_order" ? "active" : ""}`}
            onClick={() => setActiveTab("new_order")}
          >
            Đơn hàng mới
          </button>
        </div>

        <div className="notification-content">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} className="empty-icon" />
              <p>Không có thông báo nào</p>
            </div>
          ) : (
            <div className="notification-list">
              {filteredNotifications.map((notification, index) => (
                <div
                  key={index}
                  className={`notification-item ${
                    !notification.read ? "unread" : ""
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      onMarkAsRead(index);
                    }
                    if (notification.orderId) {
                      onViewOrder(notification.orderId);
                    }
                  }}
                >
                  <div className="notification-icon-container">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="notification-content-main">
                    <div className="notification-header-row">
                      <div className="notification-title-wrapper">
                        <div className="notification-title">
                          {notification.title}
                        </div>
                        <div className="notification-timestamp">
                          {formatDate(
                            notification.timestamp || notification.createdAt
                          )}
                        </div>
                      </div>
                    </div>

                    {(notification.message || notification.content) && (
                      <div
                        className="notification-message"
                        dangerouslySetInnerHTML={highlightMessage(
                          notification.message || notification.content || ""
                        )}
                      />
                    )}

                    {notification.orderDetails && (
                      <div className="order-details">
                        <div className="order-info">
                          <div className="order-id">
                            #{notification.orderDetails.id}
                          </div>
                          <div className="order-customer">
                            <User size={14} />
                            {notification.orderDetails.customerName}
                          </div>
                          <div className="order-phone">
                            <Phone size={14} />
                            {notification.orderDetails.customerPhone}
                          </div>
                          <div className="order-address">
                            <MapPin size={14} />
                            {notification.orderDetails.deliveryAddress}
                          </div>
                        </div>

                        <div className="order-summary">
                          <div className="product-name">
                            {notification.orderDetails.product}
                          </div>
                          <div className="order-amount">
                            {formatCurrency(
                              notification.orderDetails.totalAmount
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="notification-footer">
          <button
            className="mark-all-read-btn"
            onClick={() => {
              notifications.forEach((_, index) => {
                if (!notifications[index].read) {
                  onMarkAsRead(index);
                }
              });
            }}
            disabled={unreadCount === 0}
          >
            <CheckCircle size={16} />
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>
    </div>
  );
}

export default SellerNotification;
