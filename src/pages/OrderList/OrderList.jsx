import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Home,
    Package,
    Clock,
    CheckCircle,
    Truck,
    AlertCircle,
    Eye,
    Phone,
    Calendar
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../test-mock-data/data/productsData';
import { getOrderHistory } from '../../api/orderApi';
import './OrderList.css';

function OrderList() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, shipping, delivered, cancelled

    // Kiểm tra đăng nhập (đúng key token thực tế)
    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const legacyToken = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const hasToken = Boolean(accessToken || legacyToken || refreshToken);
        setIsGuest(!hasToken);

        if (!hasToken) {
            navigate('/signin');
            return;
        }
    }, [navigate]);

    // Tải danh sách đơn hàng từ Backend (order history)
    useEffect(() => {
        let isMounted = true;
        async function load() {
            setLoading(true);
            try {
                // Xóa dữ liệu fake/local trước đây để chỉ hiển thị đơn thật từ hệ thống
                localStorage.removeItem('orders');

                const { items } = await getOrderHistory({ page: 1, size: 20 });

                // Giữ lại duy nhất các đơn hàng thật, ưu tiên đơn mới nhất lên đầu
                const list = Array.isArray(items) ? items.filter(Boolean) : [];
                if (isMounted) setOrders(list.reverse());
            } catch (err) {
                console.error('Không tải được lịch sử đơn hàng:', err);
                if (isMounted) setOrders([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        }
        load();
        return () => { isMounted = false; };
    }, []);

    // Lọc đơn hàng theo trạng thái
    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        return order.status === filter;
    });

    // Xử lý quay lại
    const handleGoBack = () => {
        navigate(-1);
    };

    // Xử lý về trang chủ
    const handleGoHome = () => {
        navigate('/');
    };

    // Xử lý xem chi tiết đơn hàng
    const handleViewOrder = (orderId) => {
        navigate(`/order-tracking/${orderId}`);
    };

    // Xử lý liên hệ người bán
    const handleContactSeller = (orderId) => {
        alert(`Liên hệ người bán cho đơn hàng ${orderId}`);
    };

    // Lấy icon và màu sắc cho trạng thái
    const getStatusInfo = (status) => {
        const statusConfig = {
            pending: { icon: Clock, color: '#ffc107', label: 'Chờ xác nhận' },
            confirmed: { icon: CheckCircle, color: '#17a2b8', label: 'Đã xác nhận' },
            shipping: { icon: Truck, color: '#007bff', label: 'Đang giao hàng' },
            delivered: { icon: Package, color: '#28a745', label: 'Đã giao hàng' },
            cancelled: { icon: AlertCircle, color: '#dc3545', label: 'Đã hủy' }
        };
        return statusConfig[status] || statusConfig.pending;
    };

    if (isGuest) {
        return null; // Sẽ redirect về login
    }

    if (loading) {
        return (
            <div className="order-list-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải danh sách đơn hàng...</p>
            </div>
        );
    }

    return (
        <div className="order-list-page">
            <div className="order-list-container">
                {/* Header */}
                <div className="order-list-header">
                    <div className="breadcrumb-nav">
                        <button className="breadcrumb-btn" onClick={handleGoHome}>
                            <Home size={16} />
                            <span>Trang chủ</span>
                        </button>
                        <span className="breadcrumb-separator">/</span>
                        <button className="breadcrumb-btn" onClick={handleGoBack}>
                            <ArrowLeft size={16} />
                            <span>Quay lại</span>
                        </button>
                        <span className="breadcrumb-separator">/</span>
                        <span className="breadcrumb-current">Đơn hàng của tôi</span>
                    </div>

                    <h1 className="page-title">Đơn hàng của tôi</h1>

                    {/* Filter Tabs */}
                    <div className="filter-tabs">
                        <button
                            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Tất cả ({orders.length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilter('pending')}
                        >
                            Chờ xác nhận ({orders.filter(o => o.status === 'pending').length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'confirmed' ? 'active' : ''}`}
                            onClick={() => setFilter('confirmed')}
                        >
                            Đã xác nhận ({orders.filter(o => o.status === 'confirmed').length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'shipping' ? 'active' : ''}`}
                            onClick={() => setFilter('shipping')}
                        >
                            Đang giao ({orders.filter(o => o.status === 'shipping').length})
                        </button>
                        <button
                            className={`filter-tab ${filter === 'delivered' ? 'active' : ''}`}
                            onClick={() => setFilter('delivered')}
                        >
                            Đã giao ({orders.filter(o => o.status === 'delivered').length})
                        </button>
                    </div>
                </div>

                {/* Orders List */}
                <div className="orders-content">
                    {filteredOrders.length === 0 ? (
                        <div className="no-orders">
                            <Package size={64} color="#6c757d" />
                            <h3>Chưa có đơn hàng nào</h3>
                            <p>Bạn chưa có đơn hàng nào trong trạng thái này.</p>
                            <button className="btn btn-primary" onClick={handleGoHome}>
                                Mua sắm ngay
                            </button>
                        </div>
                    ) : (
                        <div className="orders-list">
                            {filteredOrders.map(order => {
                                const statusInfo = getStatusInfo(order.status);
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <div key={order.id} className="order-card">
                                        <div className="order-header">
                                            <div className="order-info">
                                                <h3 className="order-id">Đơn hàng {order.id}</h3>
                                                <div className="order-date">
                                                    <Calendar className="date-icon" />
                                                    <span>{formatDate(order.createdAt)}</span>
                                                </div>
                                            </div>
                                            <div className="order-status">
                                                <div
                                                    className="status-badge"
                                                    style={{ backgroundColor: statusInfo.color }}
                                                >
                                                    <StatusIcon size={16} color="white" />
                                                    <span>{statusInfo.label}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="order-content">
                                            <div className="product-info">
                                                <div className="product-image">
                                                    <img src={order.product.image} alt={order.product.title} />
                                                </div>
                                                <div className="product-details">
                                                    <h4 className="product-title">{order.product.title}</h4>
                                                    <p className="product-brand">{order.product.brand} • {order.product.model}</p>
                                                    <div className="product-condition">{order.product.conditionLevel}</div>
                                                </div>
                                            </div>

                                            <div className="order-summary">
                                                <div className="price-info">
                                                    <div className="total-price">{formatCurrency(order.finalPrice)}</div>
                                                    <div className="shipping-info">
                                                        Bao gồm phí ship: {formatCurrency(order.shippingFee)}
                                                    </div>
                                                </div>

                                                <div className="order-actions">
                                                    <button
                                                        className="btn btn-outline-primary"
                                                        onClick={() => handleViewOrder(order.id)}
                                                    >
                                                        <Eye className="btn-icon" />
                                                        Xem chi tiết
                                                    </button>

                                                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                                                        <button
                                                            className="btn btn-outline-secondary"
                                                            onClick={() => handleContactSeller(order.id)}
                                                        >
                                                            <Phone className="btn-icon" />
                                                            Liên hệ
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {order.status === 'delivered' && (
                                            <div className="order-footer">
                                                <div className="delivery-success">
                                                    <CheckCircle size={16} color="#28a745" />
                                                    <span>Đơn hàng đã được giao thành công</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OrderList;
