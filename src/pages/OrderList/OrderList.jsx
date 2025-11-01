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
    Star,
    Eye,
    Phone,
    Calendar,
    ChevronDown,
    ChevronUp,
    CreditCard,
    MapPin,
    ShoppingBag
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../test-mock-data/data/productsData';
import { getOrderHistory } from '../../api/orderApi';
// tui có thêm phần này
import DisputeForm from "../../components/BuyerRaiseDispute/DisputeForm";
import './OrderList.css';

function OrderList() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, shipping, delivered, cancelled
    const [query, setQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    // thêm dòng này nữa
    const [selectedDisputeOrderId, setSelectedDisputeOrderId] = useState(null);

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
                const { items } = await getOrderHistory({ page: 1, size: 10 });

                let list = Array.isArray(items) ? items.filter(Boolean) : [];

                // Fallback: nếu BE chưa trả lịch sử (trễ đồng bộ), hiển thị đơn mới nhất lưu localStorage
                if (list.length === 0) {
                    try {
                        const local = JSON.parse(localStorage.getItem('orders') || '[]');
                        if (Array.isArray(local) && local.length > 0) list = [local[local.length - 1]];
                    } catch (e) { console.warn('Local orders parse failed:', e); }
                }

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

    // Lọc theo trạng thái + tìm kiếm
    const filteredOrders = orders
        .filter(order => (filter === 'all' ? true : order.status === filter))
        .filter(order => {
            if (!query.trim()) return true;
            const q = query.trim().toLowerCase();
            const idStr = String(order.id || '').toLowerCase();
            const title = String(order.product?.title || '').toLowerCase();
            const code = String(order._raw?.orderCode || '').toLowerCase();
            return idStr.includes(q) || title.includes(q) || code.includes(q);
        });

    // Stats
    const totalOrders = orders.length;
    const totalDelivered = orders.filter(o => o.status === 'delivered').length;
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.finalPrice || 0), 0);

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

    // Hành động theo trạng thái (placeholder, sẽ nối API sau)
    const handleCancelOrder = (orderId) => {
        alert(`Hủy đơn #${orderId} (sẽ triển khai API sau)`);
    };

    const handleTrackShipment = (orderId) => {
        navigate(`/order-tracking/${orderId}`);
    };
    // ******
    const handleRaiseDispute = (orderId) => {
        setSelectedDisputeOrderId(orderId);  // thêm dòng này thay thế cho cái alert nha Vy
    };

    const handleCancelDispute = () => {
        setSelectedDisputeOrderId(null);
        // Sau khi gửi/hủy dispute, ta cũng nên tải lại danh sách orders (tùy chọn)
        // load(); // Có thể uncomment nếu muốn refresh list sau khi gửi khiếu nại
    };

    const handleRateOrder = (orderId) => {
        alert(`Đánh giá đơn #${orderId} (flow rating sẽ thêm sau)`);
    };

    const handleReorder = (orderId) => {
        alert(`Đặt lại đơn #${orderId} (sẽ thiết kế sau)`);
    };

    const getActionsForStatus = (status, orderId) => {
        switch (status) {
            case 'pending':
                return [
                    { key: 'cancel', label: 'Hủy đơn', className: 'btn btn-danger btn-sm btn-animate', onClick: () => handleCancelOrder(orderId) }
                ];
            case 'confirmed':
                return [
                    { key: 'cancel', label: 'Hủy đơn', className: 'btn btn-danger btn-sm btn-animate', onClick: () => handleCancelOrder(orderId) }
                ];
            case 'shipping':
                return [
                    { key: 'track', label: 'Theo dõi vận đơn', className: 'btn btn-primary btn-sm btn-animate', onClick: () => handleTrackShipment(orderId) }
                ];
            case 'delivered':
                return [
                    { key: 'dispute', label: 'Khiếu nại', className: 'btn btn-warning btn-sm btn-animate', onClick: () => handleRaiseDispute(orderId) },
                    { key: 'rate', label: 'Đánh giá', className: 'btn btn-success btn-sm btn-animate', onClick: () => handleRateOrder(orderId) }
                ];
            case 'cancelled':
                return [
                    { key: 'reorder', label: 'Đặt lại', className: 'btn btn-secondary btn-sm btn-animate', onClick: () => handleReorder(orderId) }
                ];
            default:
                return [];
        }
    };

    // Xử lý liên hệ người bán (không dùng ở layout mới)

    // Lấy icon và màu sắc cho trạng thái (label theo mockup)

    if (selectedDisputeOrderId !== null) {
        return (
            <div className="dispute-flow-wrapper">
                <button 
                    className="btn-back-order-list" 
                    onClick={handleCancelDispute}
                    style={{ marginBottom: '15px', padding: '8px 15px', border: '1px solid #ccc', borderRadius: '4px', background: '#f8f9fa' }}
                >
                    <ArrowLeft size={16} style={{ marginRight: 5 }} /> Quay lại danh sách đơn hàng
                </button>
                <DisputeForm 
                    initialOrderId={selectedDisputeOrderId} 
                    onCancelDispute={handleCancelDispute} // Thêm prop để form có thể tự thoát
                />
            </div>
        );
    }
    
    // 2. Nếu đang ở chế độ xem Danh sách đơn hàng

    const getStatusInfo = (status) => {
        const statusConfig = {
            pending: { icon: Clock, color: '#ffc107', label: 'Chờ xử lý' },
            confirmed: { icon: CheckCircle, color: '#0d6efd', label: 'Đã xác nhận' },
            shipping: { icon: Truck, color: '#0d6efd', label: 'Đang giao' },
            delivered: { icon: Package, color: '#28a745', label: 'Đã giao' },
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

                    <h1 className="page-title">Lịch sử đơn hàng</h1>

                    {/* Search */}
                    <div style={{ marginBottom: 16 }}>
                        <input
                            type="text"
                            placeholder="Tìm kiếm đơn hàng theo mã hoặc sản phẩm..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: '2px solid #e9ecef',
                                outline: 'none',
                                fontSize: 14
                            }}
                        />
                    </div>

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
                        <div className="empty-orders">
                            <div className="empty-hero">
                                <div className="empty-hero-glow"></div>
                                <div className="empty-hero-icon">
                                    <ShoppingBag className="empty-hero-svg" />
                                </div>
                            </div>
                            <h3 className="empty-title">Chưa có đơn hàng nào</h3>
                            <p className="empty-subtitle">Bạn chưa có đơn hàng nào. Hãy khám phá và mua sắm sản phẩm yêu thích!</p>
                            <button className="btn btn-primary" onClick={handleGoHome}>Bắt đầu mua sắm</button>
                        </div>
                    ) : (
                        <div className="orders-list">
                            {filteredOrders.map(order => {
                                const statusInfo = getStatusInfo(order.status);
                                const StatusIcon = statusInfo.icon;
                                const orderCode = order._raw?.orderCode || order.id;
                                const productCount = Number(order._raw?.quantity || 1);

                                return (
                                    <div key={order.id} className="order-card" onClick={() => handleViewOrder(order.id)}>
                                        <div className="order-header">
                                            <div className="order-info">
                                                <h3 className="order-id">Đơn hàng #{orderCode}</h3>
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
                                            <div className="order-product-row">
                                                <div className="thumb">
                                                    <img src={order.product?.image || '/vite.svg'} alt={order.product?.title || 'product'} />
                                                </div>
                                                <div className="info-rows">
                                                    <div className="info-row">
                                                        <span className="label">Số lượng sản phẩm:</span>
                                                        <span className="value">{productCount} sản phẩm</span>
                                                    </div>
                                                    <div className="info-row">
                                                        <span className="label">Tổng cộng:</span>
                                                        <span className="value total-price-blue">{formatCurrency(order.finalPrice)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="expand-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {/* Chỉ giữ action trái cho trạng thái cần thiết (ví dụ: shipping: theo dõi vận đơn) */}
                                            {order.status === 'shipping' && getActionsForStatus(order.status, order.id).map(action => (
                                                <button
                                                    key={action.key}
                                                    className={action.className}
                                                    onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                                                >
                                                    {action.label}
                                                </button>
                                            ))}
                                            {/* Nút xem chi tiết */}
                                            <button
                                                className="btn btn-soft-primary btn-sm btn-animate"
                                                onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === order.id ? null : order.id); }}
                                            >
                                                {expandedId === order.id ? (
                                                    <>
                                                        Thu gọn <ChevronUp className="btn-icon" />
                                                    </>
                                                ) : (
                                                    <>
                                                        Xem chi tiết <ChevronDown className="btn-icon" />
                                                    </>
                                                )}
                                            </button>
                                            {/* Nút theo dõi đơn hàng */}
                                            <button className="btn btn-primary btn-sm btn-animate" onClick={(e) => { e.stopPropagation(); handleViewOrder(order.id); }}>
                                                <Eye className="btn-icon" />
                                                Theo dõi đơn hàng
                                            </button>
                                            {/* Nhóm bên phải: Huỷ (pending/confirmed) hoặc Khiếu nại/Đánh giá (delivered) */}
                                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                                {(order.status === 'pending' || order.status === 'confirmed') && (
                                                    <button
                                                        className="btn btn-danger btn-sm btn-animate"
                                                        onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                                                    >
                                                        Hủy đơn
                                                    </button>
                                                )}
                                                {order.status === 'delivered' && (
                                                    <>
                                                        <button
                                                            className="btn btn-success btn-sm btn-animate"
                                                            style={{ backgroundColor: '#28a745', boxShadow: '0 0 0 0 rgba(0,0,0,0)', filter: 'drop-shadow(0 0 8px rgba(40,167,69,0.45))' }}
                                                            onClick={(e) => { e.stopPropagation(); handleRateOrder(order.id); }}
                                                        >
                                                            Đánh giá
                                                        </button>
                                                        <button
                                                            className="btn btn-warning btn-sm btn-animate"
                                                            style={{ backgroundColor: '#ffc107', color: '#212529', filter: 'drop-shadow(0 0 8px rgba(255,193,7,0.45))' }}
                                                            onClick={(e) => { e.stopPropagation(); handleRaiseDispute(order.id); }}
                                                        >
                                                            Khiếu nại
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {expandedId === order.id && (
                                            <div className="order-expanded">
                                                <div className="expanded-section">
                                                    <h4>Thông tin giao hàng</h4>
                                                    <div className="expanded-row">
                                                        <MapPin className="expanded-icon" />
                                                        <div>
                                                            <div className="expanded-label">Địa chỉ</div>
                                                            <div className="expanded-text">{order._raw?.shippingAddress || 'Chưa cập nhật'}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="expanded-section">
                                                    <h4>Thanh toán</h4>
                                                    <div className="expanded-row">
                                                        <CreditCard className="expanded-icon" />
                                                        <div>
                                                            <div className="expanded-label">Phương thức</div>
                                                            <div className="expanded-text">{order._raw?.paymentMethod || (order.status === 'confirmed' ? 'Ví điện tử' : 'COD')}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                {/* Summary Footer */}
                <div className="order-card" style={{ marginTop: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center' }}>
                        <div>
                            <div style={{ color: '#6c757d', marginBottom: 6 }}>Tổng đơn hàng</div>
                            <div style={{ fontWeight: 700, color: '#0d6efd' }}>{totalOrders}</div>
                        </div>
                        <div>
                            <div style={{ color: '#6c757d', marginBottom: 6 }}>Đã giao thành công</div>
                            <div style={{ fontWeight: 700, color: '#28a745' }}>{totalDelivered}</div>
                        </div>
                        <div>
                            <div style={{ color: '#6c757d', marginBottom: 6 }}>Tổng chi tiêu</div>
                            <div style={{ fontWeight: 700, color: '#0d6efd' }}>{formatCurrency(totalSpent)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderList;
