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
import { getOrderHistory } from '../../api/orderApi';

function OrderTracking() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(true);
    const getPaymentMethodLabel = (method) => {
        if (method === 'cod') return 'Thanh toán khi nhận hàng';
        if (method === 'bank_transfer') return 'Chuyển khoản ngân hàng';
        if (method === 'ewallet') return 'Ví điện tử';
        return 'Khác';
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending':
                return 'Chờ xác nhận';
            case 'confirmed':
                return 'Đã xác nhận';
            case 'shipping':
                return 'Đang giao hàng';
            case 'delivered':
                return 'Đã giao hàng';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return 'Không xác định';
        }
    };

    // Kiểm tra đăng nhập
    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsGuest(!token);

        if (!token) {
            navigate('/signin');
            return;
        }
    }, [navigate]);

    // Tải thông tin đơn hàng (ưu tiên localStorage, fallback Backend order history)
    useEffect(() => {
        const loadOrder = async () => {
            try {
                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                let foundOrder = orders.find(o => String(o.id) === String(orderId));

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
                    // Fallback: gọi Backend lịch sử và tìm theo id hoặc orderCode
                    try {
                        const { items } = await getOrderHistory({ page: 1, size: 50 });
                        const byId = (items || []).find(x => String(x?.id) === String(orderId));
                        const byCode = (items || []).find(x => String(x?._raw?.orderCode) === String(orderId));
                        const beOrder = byId || byCode || null;
                        if (beOrder) {
                            const mapped = mapHistoryItemToTracking(beOrder);
                            setOrder(mapped);
                        } else {
                            setOrder(null);
                        }
                    } catch (e) {
                        console.error('Không lấy được order history:', e);
                        setOrder(null);
                    }
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

    function mapHistoryItemToTracking(item) {
        const id = item.id ?? item._raw?.orderCode ?? String(Date.now());
        const createdAt = item.createdAt || item._raw?.createdAt || new Date().toISOString();
        const shippingFee = Number(item.shippingFee || 0);
        const finalPrice = Number(item.finalPrice || item._raw?.price || 0);
        const totalPrice = finalPrice - shippingFee;
        const status = item.status || 'confirmed';

        const product = {
            image: item.product?.image || '/vite.svg',
            title: item.product?.title || `Đơn hàng ${item._raw?.orderCode || id}`,
            price: totalPrice,
        };

        return {
            id,
            createdAt,
            estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            status,
            product,
            items: [],
            totalPrice,
            shippingFee,
            finalPrice: totalPrice + shippingFee,
            buyerName: '',
            buyerPhone: item._raw?.phoneNumber || '',
            deliveryAddress: item._raw?.shippingAddress || '',
            paymentMethod: status === 'confirmed' ? 'ewallet' : 'cod',
        };
    }

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
                    <div className="page-meta">
                        <div className="meta-left">
                            <span className="chip">
                                <Package size={14} />
                                Mã đơn: {order.id}
                            </span>
                            <span className="chip">
                                <Calendar size={14} />
                                Đặt: {formatDate(order.createdAt)}
                            </span>
                            <span className="chip">
                                <Clock size={14} />
                                Dự kiến: {formatDate(order.estimatedDelivery)}
                            </span>
                            <span className="chip">
                                <CreditCard size={14} />
                                {getPaymentMethodLabel(order.paymentMethod)}
                            </span>
                        </div>
                        <span className={`status-badge ${order.status}`}>
                            {getStatusLabel(order.status)}
                        </span>
                    </div>
                </div>

                <div className="order-tracking-content">
                    {/* Cột trái - Thông tin đơn hàng */}
                    <div className="order-info-column">
                        {/* Header thành công + bước tiến trình (theo mẫu) */}
                        <div className="success-header">
                            <div className="success-icon">
                                <CheckCircle size={28} color="#2bb673" />
                            </div>
                            <h2 className="success-title">Đặt hàng thành công!</h2>
                            <p className="success-subtitle">Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đang được xử lý.</p>
                        </div>

                        <div className="progress-card">
                            <div className="progress-steps">
                                <div className={`p-step ${['pending', 'confirmed', 'shipping', 'delivered'].indexOf(order.status) >= 0 ? 'active' : ''}`}>
                                    <div className="p-dot"><CheckCircle size={16} color="#fff" /></div>
                                    <div className="p-label">Đã đặt hàng</div>
                                    <div className="p-time">{formatDate(order.createdAt)}</div>
                                </div>
                                <div className={`p-sep ${['confirmed', 'shipping', 'delivered'].includes(order.status) ? 'active' : ''}`}></div>
                                <div className={`p-step ${['confirmed', 'shipping', 'delivered'].includes(order.status) ? 'active' : ''}`}>
                                    <div className="p-dot"><CheckCircle size={16} color="#fff" /></div>
                                    <div className="p-label">Đang xử lý</div>
                                    <div className="p-time">{formatDate(order.createdAt)}</div>
                                </div>
                                <div className={`p-sep ${['shipping', 'delivered'].includes(order.status) ? 'active' : ''}`}></div>
                                <div className={`p-step ${['shipping', 'delivered'].includes(order.status) ? 'active' : ''}`}>
                                    <div className="p-dot"><Truck size={16} color="#fff" /></div>
                                    <div className="p-label">Đang vận chuyển</div>
                                    <div className="p-time">{formatDate(order.estimatedDelivery)}</div>
                                </div>
                                <div className={`p-sep ${order.status === 'delivered' ? 'active' : ''}`}></div>
                                <div className={`p-step ${order.status === 'delivered' ? 'active' : ''}`}>
                                    <div className="p-dot"><Package size={16} color="#fff" /></div>
                                    <div className="p-label">Đã giao hàng</div>
                                    <div className="p-time">{formatDate(order.estimatedDelivery)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Danh sách sản phẩm (theo mẫu) */}
                        <div className="order-items-card">
                            <div className="card-head">
                                <h3>Chi tiết đơn hàng</h3>
                                <span className="code-badge">#{order.id}</span>
                            </div>
                            {(order.items && Array.isArray(order.items) && order.items.length > 0)
                                ? (
                                    order.items.map((it) => (
                                        <div key={it.id || it.name} className="item-row">
                                            <div className="i-thumb">
                                                <img
                                                    src={it.image}
                                                    alt={it.name}
                                                    onError={(e) => {
                                                        if (e.target && !e.target.dataset.fallback) {
                                                            e.target.dataset.fallback = 'true';
                                                            e.target.src = '/default-avatar.png';
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="i-info">
                                                <div className="i-name">{it.name}</div>
                                                <div className="i-sub">Số lượng: {it.quantity}</div>
                                            </div>
                                            <div className="i-price">{formatCurrency(it.price)}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="item-row">
                                        <div className="i-thumb">
                                            <img
                                                src={order.product.image}
                                                alt={order.product.title}
                                                onError={(e) => {
                                                    if (e.target && !e.target.dataset.fallback) {
                                                        e.target.dataset.fallback = 'true';
                                                        e.target.src = '/default-avatar.png';
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="i-info">
                                            <div className="i-name">{order.product.title}</div>
                                            <div className="i-sub">Số lượng: 1</div>
                                        </div>
                                        <div className="i-price">{formatCurrency(order.product.price)}</div>
                                    </div>
                                )}

                            {/* Tổng tiền nằm cùng trong chi tiết đơn hàng */}
                            <div className="price-breakdown">
                                <div className="price-item">
                                    <span className="price-label">Tạm tính</span>
                                    <span className="price-value">{formatCurrency(order.totalPrice)}</span>
                                </div>
                                <div className="price-item">
                                    <span className="price-label">Phí vận chuyển</span>
                                    <span className="price-value">{formatCurrency(order.shippingFee)}</span>
                                </div>
                                <div className="price-item total">
                                    <span className="price-label">Tổng cộng</span>
                                    <span className="price-value">{formatCurrency(order.finalPrice)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Thông tin giao hàng & thanh toán (2 cột) */}
                        <div className="info-grid">
                            <div className="info-card">
                                <div className="card-head">
                                    <h4>
                                        <MapPin size={16} className="card-icon" />
                                        Thông tin giao hàng
                                    </h4>
                                </div>
                                <div className="info-line"><User size={16} /> {order.buyerName}</div>
                                <div className="info-line"><Phone size={16} /> {order.buyerPhone}</div>
                                <div className="info-line"><MapPin size={16} /> {order.deliveryAddress}</div>
                            </div>
                            <div className="info-card">
                                <div className="card-head">
                                    <h4>
                                        <CreditCard size={16} className="card-icon" />
                                        Phương thức thanh toán
                                    </h4>
                                </div>
                                <div className="payment-method">
                                    <div className="payment-icon">
                                        <CreditCard size={20} color="white" />
                                    </div>
                                    <div className="payment-info">
                                        <div className="payment-label">{getPaymentMethodLabel(order.paymentMethod)}</div>
                                        <div className="paid-note">Đã thanh toán</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="action-buttons-bottom">
                            <button className="btn btn-success">
                                <Package className="btn-icon" />
                                Tải hóa đơn
                            </button>
                            <button className="btn btn-outline-primary">
                                <Home className="btn-icon" />
                                Tiếp tục mua sắm
                            </button>
                        </div>
                    </div>

                    {/* Cột phải - Hành động & hỗ trợ (tổng tiền đã chuyển sang chi tiết đơn hàng) */}
                    <div className="order-actions-column">
                        {/* Bỏ card tổng tiền riêng để tránh trùng lặp */}

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
