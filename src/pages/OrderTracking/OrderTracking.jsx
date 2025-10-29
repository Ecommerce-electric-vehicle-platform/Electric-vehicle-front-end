import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Home,
    MapPin,
    Phone,
    CreditCard,
    Calendar,
    Package,
    User,
    Truck,
    Clock,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../test-mock-data/data/productsData';
import OrderStatus from '../../components/OrderStatus/OrderStatus';
import './OrderTracking.css';

function OrderTracking() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(true);

    // Kiểm tra đăng nhập
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsGuest(!token);

        if (!token) {
            navigate('/signin');
            return;
        }
    }, [navigate]);

    // Tải thông tin đơn hàng
    useEffect(() => {
        const loadOrder = () => {
            try {
                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                const foundOrder = orders.find(o => o.id === orderId);

                if (foundOrder) {
                    // Giả lập cập nhật trạng thái đơn hàng theo thời gian
                    const orderDate = new Date(foundOrder.createdAt);
                    const now = new Date();
                    const daysDiff = Math.floor((now - orderDate) / (1000 * 60 * 60 * 24));

                    let updatedStatus = foundOrder.status;

                    // Logic cập nhật trạng thái tự động
                    if (daysDiff >= 0 && foundOrder.status === 'pending') {
                        updatedStatus = 'confirmed';
                    }
                    if (daysDiff >= 1 && foundOrder.status === 'confirmed') {
                        updatedStatus = 'shipping';
                    }
                    if (daysDiff >= 3 && foundOrder.status === 'shipping') {
                        updatedStatus = 'delivered';
                    }

                    // Cập nhật trạng thái nếu có thay đổi
                    if (updatedStatus !== foundOrder.status) {
                        foundOrder.status = updatedStatus;
                        const updatedOrders = orders.map(o => o.id === orderId ? foundOrder : o);
                        localStorage.setItem('orders', JSON.stringify(updatedOrders));
                    }

                    setOrder(foundOrder);
                } else {
                    setOrder(null);
                }
            } catch (error) {
                console.error('Error loading order:', error);
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };

        loadOrder();
    }, [orderId]);

    // Xử lý quay lại
    const handleGoBack = () => {
        navigate(-1);
    };

    // Xử lý về trang chủ
    const handleGoHome = () => {
        navigate('/');
    };

    // Xử lý liên hệ người bán
    const handleContactSeller = () => {
        alert('Chức năng liên hệ người bán sẽ được phát triển');
    };

    // Xử lý hủy đơn hàng
    const handleCancelOrder = () => {
        if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            const updatedOrders = orders.map(o =>
                o.id === orderId ? { ...o, status: 'cancelled' } : o
            );
            localStorage.setItem('orders', JSON.stringify(updatedOrders));
            setOrder({ ...order, status: 'cancelled' });
        }
    };

    if (isGuest) {
        return null; // Sẽ redirect về login
    }

    if (loading) {
        return (
            <div className="order-tracking-loading">
                <div className="loading-spinner"></div>
                <p>Đang tải thông tin đơn hàng...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-tracking-error">
                <div className="error-icon">
                    <AlertCircle size={64} color="#dc3545" />
                </div>
                <h3>Không tìm thấy đơn hàng</h3>
                <p>Đơn hàng với mã {orderId} không tồn tại hoặc đã bị xóa.</p>
                <button className="btn btn-primary" onClick={handleGoHome}>
                    Về trang chủ
                </button>
            </div>
        );
    }

    return (
        <div className="order-tracking-page">
            <div className="order-tracking-container">
                {/* Header */}
                <div className="order-tracking-header">
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
                        <span className="breadcrumb-current">Theo dõi đơn hàng</span>
                    </div>

                    <h1 className="page-title">Theo dõi đơn hàng</h1>
                </div>

                <div className="order-tracking-content">
                    {/* Cột trái - Thông tin đơn hàng */}
                    <div className="order-info-column">
                        {/* Trạng thái đơn hàng */}
                        <OrderStatus status={order.status} />

                        {/* Thông tin đơn hàng */}
                        <div className="order-details">
                            <h3 className="section-title">
                                <Package className="section-icon" />
                                Thông tin đơn hàng
                            </h3>

                            <div className="order-info-grid">
                                <div className="info-item">
                                    <span className="info-label">Mã đơn hàng:</span>
                                    <span className="info-value">{order.id}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Ngày đặt:</span>
                                    <span className="info-value">{formatDate(order.createdAt)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Dự kiến giao:</span>
                                    <span className="info-value">{formatDate(order.estimatedDelivery)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Phương thức thanh toán:</span>
                                    <span className="info-value">
                                        {order.paymentMethod === 'cod'
                                            ? 'Thanh toán khi nhận hàng'
                                            : order.paymentMethod === 'bank_transfer'
                                                ? 'Chuyển khoản ngân hàng'
                                                : order.paymentMethod === 'ewallet'
                                                    ? 'Ví điện tử'
                                                    : 'Khác'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Thông tin sản phẩm */}
                        <div className="product-details">
                            <h3 className="section-title">
                                <Package className="section-icon" />
                                Sản phẩm đã đặt
                            </h3>

                            <div className="product-item">
                                <div className="product-image">
                                    <img src={order.product.image} alt={order.product.title} />
                                </div>
                                <div className="product-info">
                                    <h4 className="product-title">{order.product.title}</h4>
                                    <p className="product-brand">{order.product.brand} • {order.product.model}</p>
                                    <div className="product-condition">{order.product.conditionLevel}</div>
                                    <div className="product-price">{formatCurrency(order.product.price)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Thông tin giao hàng */}
                        <div className="delivery-info">
                            <h3 className="section-title">
                                <MapPin className="section-icon" />
                                Thông tin giao hàng
                            </h3>

                            <div className="delivery-details">
                                <div className="delivery-item">
                                    <MapPin className="delivery-icon" />
                                    <div className="delivery-content">
                                        <div className="delivery-label">Địa chỉ giao hàng:</div>
                                        <div className="delivery-value">{order.deliveryAddress}</div>
                                    </div>
                                </div>
                                <div className="delivery-item">
                                    <Phone className="delivery-icon" />
                                    <div className="delivery-content">
                                        <div className="delivery-label">Số điện thoại:</div>
                                        <div className="delivery-value">{order.deliveryPhone}</div>
                                    </div>
                                </div>
                                {order.deliveryNote && (
                                    <div className="delivery-item">
                                        <AlertCircle className="delivery-icon" />
                                        <div className="delivery-content">
                                            <div className="delivery-label">Ghi chú:</div>
                                            <div className="delivery-value">{order.deliveryNote}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Thông tin người mua */}
                        <div className="buyer-info">
                            <h3 className="section-title">
                                <User className="section-icon" />
                                Thông tin người mua
                            </h3>

                            <div className="buyer-details">
                                <div className="buyer-item">
                                    <span className="buyer-label">Họ tên:</span>
                                    <span className="buyer-value">{order.buyerName}</span>
                                </div>
                                <div className="buyer-item">
                                    <span className="buyer-label">Số điện thoại:</span>
                                    <span className="buyer-value">{order.buyerPhone}</span>
                                </div>
                                <div className="buyer-item">
                                    <span className="buyer-label">Email:</span>
                                    <span className="buyer-value">{order.buyerEmail}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải - Tổng tiền và hành động */}
                    <div className="order-actions-column">
                        {/* Tổng tiền */}
                        <div className="order-summary">
                            <h3 className="summary-title">Tổng đơn hàng</h3>

                            <div className="price-breakdown">
                                <div className="price-item">
                                    <span className="price-label">Tạm tính:</span>
                                    <span className="price-value">{formatCurrency(order.totalPrice)}</span>
                                </div>
                                <div className="price-item">
                                    <span className="price-label">Phí vận chuyển:</span>
                                    <span className="price-value">{formatCurrency(order.shippingFee)}</span>
                                </div>
                                <div className="price-item total">
                                    <span className="price-label">Tổng cộng:</span>
                                    <span className="price-value">{formatCurrency(order.finalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Hành động */}
                        <div className="order-actions">
                            {order.status === 'pending' && (
                                <div className="action-buttons">
                                    <button className="btn btn-primary" onClick={handleContactSeller}>
                                        <Phone className="btn-icon" />
                                        Liên hệ người bán
                                    </button>
                                    <button className="btn btn-outline-danger" onClick={handleCancelOrder}>
                                        <AlertCircle className="btn-icon" />
                                        Hủy đơn hàng
                                    </button>
                                </div>
                            )}

                            {order.status === 'confirmed' && (
                                <div className="action-buttons">
                                    <button className="btn btn-primary" onClick={handleContactSeller}>
                                        <Phone className="btn-icon" />
                                        Liên hệ người bán
                                    </button>
                                    <div className="status-note">
                                        <Clock className="note-icon" />
                                        <span>Đơn hàng đang được chuẩn bị</span>
                                    </div>
                                </div>
                            )}

                            {order.status === 'shipping' && (
                                <div className="action-buttons">
                                    <button className="btn btn-primary" onClick={handleContactSeller}>
                                        <Phone className="btn-icon" />
                                        Liên hệ người bán
                                    </button>
                                    <div className="status-note">
                                        <Truck className="note-icon" />
                                        <span>Đơn hàng đang trên đường</span>
                                    </div>
                                </div>
                            )}

                            {order.status === 'delivered' && (
                                <div className="action-buttons">
                                    <button className="btn btn-success">
                                        <CheckCircle className="btn-icon" />
                                        Đã nhận hàng
                                    </button>
                                    <div className="status-note success">
                                        <CheckCircle className="note-icon" />
                                        <span>Đơn hàng đã được giao thành công</span>
                                    </div>
                                </div>
                            )}

                            {order.status === 'cancelled' && (
                                <div className="action-buttons">
                                    <div className="status-note error">
                                        <AlertCircle className="note-icon" />
                                        <span>Đơn hàng đã bị hủy</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thông tin hỗ trợ */}
                        <div className="support-info">
                            <h4 className="support-title">Cần hỗ trợ?</h4>
                            <p className="support-desc">
                                Nếu bạn có bất kỳ thắc mắc nào về đơn hàng, vui lòng liên hệ với chúng tôi.
                            </p>
                            <button className="btn btn-outline-primary">
                                <Phone className="btn-icon" />
                                Liên hệ hỗ trợ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderTracking;
