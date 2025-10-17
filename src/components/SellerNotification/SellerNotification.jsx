import React, { useState, useEffect } from 'react';
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
    Eye
} from 'lucide-react';
import './SellerNotification.css';

function SellerNotification({ isOpen, onClose, notifications, onMarkAsRead, onViewOrder }) {
    const [activeTab, setActiveTab] = useState('all');

    const formatCurrency = (value) => {
        return value.toLocaleString("vi-VN") + " ₫";
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_order':
                return <ShoppingCart size={20} className="notification-icon new-order" />;
            case 'order_update':
                return <Package size={20} className="notification-icon order-update" />;
            case 'payment_received':
                return <DollarSign size={20} className="notification-icon payment" />;
            default:
                return <Bell size={20} className="notification-icon default" />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'new_order':
                return '#10B981';
            case 'order_update':
                return '#3B82F6';
            case 'payment_received':
                return '#059669';
            default:
                return '#6B7280';
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        if (activeTab === 'all') return true;
        if (activeTab === 'unread') return !notification.read;
        return notification.type === activeTab;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className={`seller-notification-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className="seller-notification-modal" onClick={(e) => e.stopPropagation()}>
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
                        className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        Tất cả ({notifications.length})
                    </button>
                    <button
                        className={`tab ${activeTab === 'unread' ? 'active' : ''}`}
                        onClick={() => setActiveTab('unread')}
                    >
                        Chưa đọc ({unreadCount})
                    </button>
                    <button
                        className={`tab ${activeTab === 'new_order' ? 'active' : ''}`}
                        onClick={() => setActiveTab('new_order')}
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
                                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
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
                                        <div className="notification-title">
                                            {notification.title}
                                        </div>
                                        <div className="notification-message">
                                            {notification.message}
                                        </div>

                                        {notification.orderDetails && (
                                            <div className="order-details">
                                                <div className="order-info">
                                                    <div className="order-id">#{notification.orderDetails.id}</div>
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
                                                        {formatCurrency(notification.orderDetails.totalAmount)}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="notification-meta">
                                            <span className="notification-time">
                                                <Clock size={12} />
                                                {formatDate(notification.timestamp)}
                                            </span>
                                            {!notification.read && (
                                                <span className="unread-indicator">Mới</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="notification-actions">
                                        {notification.orderId && (
                                            <button
                                                className="view-order-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewOrder(notification.orderId);
                                                }}
                                            >
                                                <Eye size={16} />
                                                Xem đơn hàng
                                            </button>
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
