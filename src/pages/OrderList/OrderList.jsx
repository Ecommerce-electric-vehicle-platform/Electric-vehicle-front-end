import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { getOrderHistory, hasOrderReview, getOrderStatus } from '../../api/orderApi';
// tui có thêm phần này
import DisputeForm from "../../components/BuyerRaiseDispute/DisputeForm";
import './OrderList.css';

function OrderList() {
    const navigate = useNavigate();
    const location = useLocation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, shipping, delivered, cancelled
    const [query, setQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [reviewedMap, setReviewedMap] = useState({}); // orderId -> true/false

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

    // Function để load order history (có thể gọi lại khi cần refresh)
    const loadOrders = useCallback(async (forceRefresh = false) => {
        let isMounted = true;

        if (forceRefresh) {
            setLoading(true);
        }

        try {
            console.log('[OrderList] Loading order history...', { forceRefresh });
            // Fetch nhiều items hơn để đảm bảo lấy được orders mới nhất
            // Và fetch trang 0 (mới nhất) thay vì trang 1
            const { items, meta } = await getOrderHistory({ page: 1, size: 20 });

            console.log('[OrderList] Order history meta:', meta);
            console.log('[OrderList] Total items from backend:', items.length);

            let list = Array.isArray(items) ? items.filter(Boolean) : [];

            // Log để debug giá từ backend
            if (list.length > 0) {
                console.log('[OrderList] Orders from backend:', list.map(o => ({
                    id: o.id,
                    orderCode: o.orderCode,
                    price: o.price,
                    shippingFee: o.shippingFee,
                    finalPrice: o.finalPrice,
                    _raw: o._raw
                })));
            }

            // LUÔN merge với localStorage orders (vì backend có thể chưa có order mới)
            try {
                const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                if (Array.isArray(localOrders) && localOrders.length > 0) {
                    console.log('[OrderList] Found localStorage orders:', localOrders.length);
                    console.log('[OrderList] LocalStorage orders:', localOrders.map(lo => ({
                        id: lo.id,
                        orderCode: lo.orderCode || lo.order_code,
                        createdAt: lo.createdAt || lo.created_at
                    })));

                    // Tạo Set từ backend orders để check duplicate
                    const existingOrderCodes = new Set();
                    const existingOrderIds = new Set();

                    list.forEach(o => {
                        const code = String(o.orderCode || o.id || '');
                        const id = String(o.id || '');
                        if (code && code !== 'undefined') existingOrderCodes.add(code);
                        if (id && id !== 'undefined') existingOrderIds.add(id);
                    });

                    console.log('[OrderList] Existing order codes from backend:', Array.from(existingOrderCodes));
                    console.log('[OrderList] Existing order ids from backend:', Array.from(existingOrderIds));

                    // Tìm các orders trong localStorage chưa có trong list từ backend
                    const newLocalOrders = localOrders.filter(lo => {
                        if (!lo) return false;
                        const orderCode = String(lo.orderCode || lo.order_code || lo.id || '');
                        const orderId = String(lo.id || '');

                        // Kiểm tra cả orderCode và orderId để tránh duplicate
                        const hasCode = orderCode && orderCode !== 'undefined';
                        const hasId = orderId && orderId !== 'undefined';

                        if (!hasCode && !hasId) return false; // Không có code hoặc id, bỏ qua

                        // Chỉ lấy orders chưa có trong backend list
                        const codeExists = hasCode && existingOrderCodes.has(orderCode);
                        const idExists = hasId && existingOrderIds.has(orderId);

                        return !codeExists && !idExists;
                    }).map(lo => {
                        // Normalize localStorage order để match với format từ backend
                        return {
                            id: lo.id || lo.orderCode || String(Math.random()),
                            orderCode: lo.order_code || lo.orderCode || lo.id,
                            status: lo.status || lo.order_status || 'pending',
                            price: lo.totalPrice || lo.price || 0,
                            shippingFee: lo.shippingFee || 0,
                            finalPrice: lo.finalPrice || lo.totalPrice || (lo.totalPrice + (lo.shippingFee || 0)),
                            shippingAddress: lo.deliveryAddress || '',
                            phoneNumber: lo.buyerPhone || '',
                            product: lo.product || {
                                image: '/vite.svg',
                                title: `Đơn hàng ${lo.orderCode || lo.id}`,
                                brand: '',
                                model: '',
                                conditionLevel: ''
                            },
                            createdAt: lo.createdAt || lo.created_at || new Date().toISOString(),
                            updatedAt: lo.updatedAt || null,
                            canceledAt: lo.canceledAt || null,
                            cancelReason: lo.cancelReason || null,
                            _raw: lo, // Giữ nguyên raw data
                            _fromLocalStorage: true // Đánh dấu để biết là từ localStorage
                        };
                    });

                    if (newLocalOrders.length > 0) {
                        console.log('[OrderList] Adding', newLocalOrders.length, 'orders from localStorage:', newLocalOrders.map(o => o.orderCode));
                        // Merge vào đầu list (orders mới nhất)
                        list = [...newLocalOrders, ...list];
                    }
                }
            } catch (e) {
                console.warn('[OrderList] Local orders parse failed:', e);
            }

            // Fallback: nếu BE chưa trả lịch sử (trễ đồng bộ), hiển thị đơn mới nhất lưu localStorage
            if (list.length === 0) {
                try {
                    const local = JSON.parse(localStorage.getItem('orders') || '[]');
                    if (Array.isArray(local) && local.length > 0) {
                        console.log('[OrderList] Using localStorage fallback:', local[local.length - 1]);
                        list = [local[local.length - 1]];
                    }
                } catch (e) { console.warn('Local orders parse failed:', e); }
            }

            const reversed = list.reverse();
            if (isMounted) setOrders(reversed);

            // Cập nhật trạng thái đơn hàng từ API shipping status
            if (isMounted && reversed.length > 0) {
                console.log('[OrderList] Updating order statuses from API...');
                const statusUpdateTasks = reversed.map(async (order) => {
                    try {
                        // Lấy orderId thực từ backend (ưu tiên _raw.id, fallback id)
                        const realOrderId = order._raw?.id ?? order.id;
                        if (!realOrderId) {
                            console.warn('[OrderList] No real orderId found for order:', order);
                            return null;
                        }

                        // Gọi API để lấy trạng thái mới nhất
                        const statusResponse = await getOrderStatus(realOrderId);
                        if (statusResponse.success && statusResponse.status) {
                            return {
                                orderId: String(order.id),
                                realOrderId: realOrderId,
                                newStatus: statusResponse.status,
                                rawStatus: statusResponse.rawStatus,
                                message: statusResponse.message
                            };
                        }
                        return null;
                    } catch (error) {
                        // Nếu lỗi 404 hoặc lỗi khác, bỏ qua và giữ nguyên trạng thái hiện tại
                        console.warn(`[OrderList] Failed to get status for order ${order.id}:`, error);
                        return null;
                    }
                });

                const statusUpdates = await Promise.allSettled(statusUpdateTasks);
                const validUpdates = statusUpdates
                    .filter(p => p.status === 'fulfilled' && p.value !== null)
                    .map(p => p.value);

                if (validUpdates.length > 0 && isMounted) {
                    console.log('[OrderList] Status updates:', validUpdates);
                    // Cập nhật trạng thái cho các orders có thay đổi
                    setOrders(prevOrders => {
                        return prevOrders.map(order => {
                            const update = validUpdates.find(u => String(u.orderId) === String(order.id));
                            if (update && update.newStatus !== order.status) {
                                console.log(`[OrderList] Updating order ${order.id} status: ${order.status} -> ${update.newStatus}`);
                                return {
                                    ...order,
                                    status: update.newStatus,
                                    _raw: {
                                        ...order._raw,
                                        status: update.rawStatus
                                    }
                                };
                            }
                            return order;
                        });
                    });
                }
            }

            // tải trạng thái đánh giá cho các đơn đã giao (check theo id thực từ BE)
            const delivered = reversed.filter(o => o.status === 'delivered');
            const tasks = delivered.map(async (o) => {
                const realId = o._raw?.id ?? o.id; // ưu tiên id thực từ BE
                const ok = await hasOrderReview(realId);
                return [String(o.id), realId, ok]; // [normalizedId, realId, hasReview]
            });
            const pairs = await Promise.allSettled(tasks);
            if (isMounted) {
                const map = {};
                pairs.forEach((p) => {
                    if (p.status === 'fulfilled' && Array.isArray(p.value)) {
                        const [normalizedId, realId, hasReview] = p.value;
                        map[normalizedId] = { hasReview: Boolean(hasReview), realId };
                    }
                });
                setReviewedMap(map);
            }
        } catch (err) {
            console.error('[OrderList] Không tải được lịch sử đơn hàng:', err);
            if (isMounted) setOrders([]);
        } finally {
            if (isMounted) setLoading(false);
        }
    },
        [] // useCallback dependencies
    );

    // Load orders khi component mount
    useEffect(() => {
        loadOrders(true);
    }, [loadOrders]);

    // Refresh khi navigate từ place order (có state refresh)
    useEffect(() => {
        if (location.state?.refreshOrders || location.state?.orderPlaced) {
            console.log('[OrderList] Refreshing orders due to navigation state');
            // Đợi một chút để backend lưu xong
            setTimeout(() => {
                loadOrders(true);
            }, 1000);
        }
    }, [location.state, loadOrders]);

    // Refresh khi window focus (user quay lại tab)
    useEffect(() => {
        const handleFocus = () => {
            console.log('[OrderList] Window focused, refreshing orders...');
            loadOrders(true);
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [loadOrders]);

    // Auto-refresh order statuses định kỳ (mỗi 30 giây)
    useEffect(() => {
        if (orders.length === 0) return;

        const refreshStatuses = async () => {
            console.log('[OrderList] Auto-refreshing order statuses...');
            const statusUpdateTasks = orders.map(async (order) => {
                try {
                    const realOrderId = order._raw?.id ?? order.id;
                    if (!realOrderId) return null;

                    const statusResponse = await getOrderStatus(realOrderId);
                    if (statusResponse.success && statusResponse.status && statusResponse.status !== order.status) {
                        return {
                            orderId: String(order.id),
                            newStatus: statusResponse.status,
                            rawStatus: statusResponse.rawStatus
                        };
                    }
                    return null;
                } catch {
                    return null;
                }
            });

            const statusUpdates = await Promise.allSettled(statusUpdateTasks);
            const validUpdates = statusUpdates
                .filter(p => p.status === 'fulfilled' && p.value !== null)
                .map(p => p.value);

            if (validUpdates.length > 0) {
                setOrders(prevOrders => {
                    return prevOrders.map(order => {
                        const update = validUpdates.find(u => String(u.orderId) === String(order.id));
                        if (update && update.newStatus !== order.status) {
                            return {
                                ...order,
                                status: update.newStatus,
                                _raw: {
                                    ...order._raw,
                                    status: update.rawStatus
                                }
                            };
                        }
                        return order;
                    });
                });
            }
        };

        // Refresh ngay khi component mount với orders
        refreshStatuses();

        // Set interval để refresh mỗi 30 giây
        const intervalId = setInterval(refreshStatuses, 30000); // 30 seconds

        return () => clearInterval(intervalId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders.length]); // Chỉ chạy khi số lượng orders thay đổi

    // Lọc theo trạng thái + tìm kiếm
    const filteredOrders = orders
        .filter(order => {
            if (filter === 'all') return true;
            if (filter === 'cancelled') {
                // Logic: Đơn bị hủy nếu có canceledAt hoặc status là cancelled
                return order.status === 'cancelled' ||
                    (order.canceledAt || order._raw?.canceledAt) != null;
            }
            return order.status === filter;
        })
        .filter(order => {
            if (!query.trim()) return true;
            const q = query.trim().toLowerCase();
            const idStr = String(order.id || '').toLowerCase();
            const title = String(order.product?.title || '').toLowerCase();
            const code = String(order.orderCode || order._raw?.orderCode || '').toLowerCase();
            return idStr.includes(q) || title.includes(q) || code.includes(q);
        });

    // Tính số lượng đơn bị hủy
    const cancelledCount = orders.filter(o =>
        o.status === 'cancelled' || (o.canceledAt || o._raw?.canceledAt) != null
    ).length;

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

    // Hành động theo trạng thái
    const handleCancelOrder = (orderId) => {
        const confirmMessage = 'Bạn có chắc chắn muốn hủy đơn hàng này không?';
        if (window.confirm(confirmMessage)) {
            // Tạm thời update localStorage để test UI
            // Sau này sẽ gọi API để hủy đơn
            const updatedOrders = orders.map(o => {
                if (String(o.id) === String(orderId)) {
                    return {
                        ...o,
                        status: 'cancelled',
                        canceledAt: new Date().toISOString(),
                        cancelReason: 'Người dùng yêu cầu hủy',
                        _raw: {
                            ...o._raw,
                            canceledAt: new Date().toISOString(),
                            cancelReason: 'Người dùng yêu cầu hủy',
                            status: 'CANCELED'
                        }
                    };
                }
                return o;
            });
            setOrders(updatedOrders);

            // TODO: Gọi API hủy đơn hàng khi backend có endpoint
            // await cancelOrderAPI(orderId, 'Người dùng yêu cầu hủy');

            alert('Đơn hàng đã được hủy. (Lưu ý: Hiện tại chỉ cập nhật local, cần kết nối API để lưu vào backend)');
        }
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

    const handleRateOrder = (orderId, order) => {
        // Truyền kèm id thực từ BE nếu có để BE nhận diện đúng đơn hàng
        const realId = order?._raw?.id ?? orderId;
        navigate(`/order/review/${orderId}`, {
            state: {
                orderIdRaw: realId,
                orderCode: order?._raw?.orderCode || null
            }
        });
    };

    const handleViewReview = (orderId, order) => {
        // Điều hướng tới trang xem đánh giá với realId từ BE
        const realId = reviewedMap[orderId]?.realId ?? order?._raw?.id ?? orderId;
        navigate(`/order/review/${orderId}`, {
            state: {
                orderIdRaw: realId,
                orderCode: order?._raw?.orderCode || null,
                viewMode: true // Đánh dấu là chế độ xem lại
            }
        });
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
            case 'delivered': {
                const isReviewed = reviewedMap[orderId]?.hasReview === true;
                return [
                    { key: 'dispute', label: 'Khiếu nại', className: 'btn btn-warning btn-sm btn-animate', onClick: () => handleRaiseDispute(orderId) },
                    isReviewed
                        ? { key: 'view-review', label: 'Xem đánh giá', className: 'btn btn-secondary btn-sm btn-animate', onClick: () => handleViewReview(orderId, null) }
                        : { key: 'rate', label: 'Đánh giá', className: 'btn btn-success btn-sm btn-animate', onClick: () => handleRateOrder(orderId, null) }
                ];
            }
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
                    <div className="filter-tabs-container">
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
                            <button
                                className={`filter-tab ${filter === 'cancelled' ? 'active' : ''}`}
                                onClick={() => setFilter('cancelled')}
                            >
                                Đã hủy ({cancelledCount})
                            </button>
                        </div>
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
                                const orderCode = order.orderCode || order._raw?.orderCode || order.id;
                                const productCount = Number(order._raw?.quantity || 1);
                                const shippingAddress = order.shippingAddress || order._raw?.shippingAddress || '';
                                const phoneNumber = order.phoneNumber || order._raw?.phoneNumber || '';
                                const canceledAt = order.canceledAt || order._raw?.canceledAt || null;
                                const cancelReason = order.cancelReason || order._raw?.cancelReason || '';

                                // Xác định xem đơn có bị hủy không (dựa vào canceledAt hoặc status)
                                const isCancelled = order.status === 'cancelled' || canceledAt != null;

                                // Xác định status để hiển thị (ưu tiên cancelled nếu đơn đã bị hủy)
                                const displayStatus = isCancelled ? 'cancelled' : order.status;
                                const displayStatusInfo = getStatusInfo(displayStatus);
                                const DisplayStatusIcon = displayStatusInfo.icon;

                                return (
                                    <div key={order.id} className={`order-card ${isCancelled ? 'order-cancelled' : ''}`} onClick={() => handleViewOrder(order.id)}>
                                        <div className="order-header">
                                            <div className="order-info">
                                                <h3 className="order-id">Đơn hàng #{orderCode}</h3>
                                                <div className="order-date">
                                                    <Calendar className="date-icon" />
                                                    <span>{formatDate(order.createdAt)}</span>
                                                    {isCancelled && canceledAt && (
                                                        <span style={{ marginLeft: '8px', color: '#dc3545', fontSize: '12px' }}>
                                                            • Hủy: {formatDate(canceledAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="order-status">
                                                <div
                                                    className="status-badge"
                                                    style={{ backgroundColor: displayStatusInfo.color }}
                                                >
                                                    <DisplayStatusIcon size={16} color="white" />
                                                    <span>{displayStatusInfo.label}</span>
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
                                            {/* Nhóm bên phải: Actions theo trạng thái */}
                                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                                {/* Actions cho đơn đã hủy */}
                                                {isCancelled && (
                                                    <button
                                                        className="btn btn-secondary btn-sm btn-animate"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReorder(order.id);
                                                        }}
                                                    >
                                                        Đặt lại
                                                    </button>
                                                )}
                                                {/* Actions cho đơn chưa hủy */}
                                                {!isCancelled && (
                                                    <>
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
                                                                {reviewedMap[order.id]?.hasReview ? (
                                                                    <button
                                                                        className="btn btn-secondary btn-sm btn-animate"
                                                                        onClick={(e) => { e.stopPropagation(); handleViewReview(order.id, order); }}
                                                                    >
                                                                        Xem đánh giá
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="btn btn-success btn-sm btn-animate"
                                                                        style={{ backgroundColor: '#28a745', boxShadow: '0 0 0 0 rgba(0,0,0,0)', filter: 'drop-shadow(0 0 8px rgba(40,167,69,0.45))' }}
                                                                        onClick={(e) => { e.stopPropagation(); handleRateOrder(order.id, order); }}
                                                                    >
                                                                        Đánh giá
                                                                    </button>
                                                                )}
                                                                <button
                                                                    className="btn btn-warning btn-sm btn-animate"
                                                                    style={{ backgroundColor: '#ffc107', color: '#212529', filter: 'drop-shadow(0 0 8px rgba(255,193,7,0.45))' }}
                                                                    onClick={(e) => { e.stopPropagation(); handleRaiseDispute(order.id); }}
                                                                >
                                                                    Khiếu nại
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {expandedId === order.id && (
                                            <div className="order-expanded">
                                                {/* Status-specific information */}
                                                {order.status === 'pending' && (
                                                    <>
                                                        <div className="expanded-status-info pending-info">
                                                            <Clock size={18} />
                                                            <div>
                                                                <div className="status-info-title">Đơn hàng đang chờ xác nhận</div>
                                                                <div className="status-info-desc">Chúng tôi đang xử lý đơn hàng của bạn. Vui lòng đợi trong giây lát.</div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {order.status === 'confirmed' && (
                                                    <>
                                                        <div className="expanded-status-info confirmed-info">
                                                            <CheckCircle size={18} />
                                                            <div>
                                                                <div className="status-info-title">Đơn hàng đã được xác nhận</div>
                                                                <div className="status-info-desc">Đơn hàng đang được chuẩn bị để giao đến bạn.</div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {order.status === 'shipping' && (
                                                    <>
                                                        <div className="expanded-status-info shipping-info">
                                                            <Truck size={18} />
                                                            <div>
                                                                <div className="status-info-title">Đơn hàng đang trên đường</div>
                                                                <div className="status-info-desc">Đơn hàng đã được giao cho đơn vị vận chuyển và đang trên đường đến bạn.</div>
                                                            </div>
                                                        </div>
                                                        {order._raw?.trackingNumber && (
                                                            <div className="expanded-section tracking-section">
                                                                <h4>
                                                                    <Package className="section-icon" />
                                                                    Thông tin vận đơn
                                                                </h4>
                                                                <div className="expanded-row">
                                                                    <div className="expanded-info-group">
                                                                        <div className="expanded-label">Mã vận đơn</div>
                                                                        <div className="expanded-text tracking-code">{order._raw.trackingNumber}</div>
                                                                    </div>
                                                                    {order._raw?.carrier && (
                                                                        <div className="expanded-info-group">
                                                                            <div className="expanded-label">Đơn vị vận chuyển</div>
                                                                            <div className="expanded-text">{order._raw.carrier}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {order.status === 'delivered' && (
                                                    <>
                                                        <div className="expanded-status-info delivered-info">
                                                            <CheckCircle size={18} />
                                                            <div>
                                                                <div className="status-info-title">Đơn hàng đã được giao thành công</div>
                                                                <div className="status-info-desc">
                                                                    {order._raw?.deliveredAt
                                                                        ? `Giao hàng vào ${formatDate(order._raw.deliveredAt)}`
                                                                        : 'Đơn hàng đã được giao đến bạn thành công.'
                                                                    }
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {order._raw?.trackingNumber && (
                                                            <div className="expanded-section tracking-section">
                                                                <h4>
                                                                    <Package className="section-icon" />
                                                                    Thông tin vận đơn
                                                                </h4>
                                                                <div className="expanded-row">
                                                                    <div className="expanded-info-group">
                                                                        <div className="expanded-label">Mã vận đơn</div>
                                                                        <div className="expanded-text tracking-code">{order._raw.trackingNumber}</div>
                                                                    </div>
                                                                    {order._raw?.carrier && (
                                                                        <div className="expanded-info-group">
                                                                            <div className="expanded-label">Đơn vị vận chuyển</div>
                                                                            <div className="expanded-text">{order._raw.carrier}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}

                                                {isCancelled && (
                                                    <>
                                                        <div className="expanded-status-info cancelled-info">
                                                            <AlertCircle size={18} />
                                                            <div>
                                                                <div className="status-info-title">Đơn hàng đã bị hủy</div>
                                                                <div className="status-info-desc">
                                                                    {cancelReason ? (
                                                                        <>
                                                                            <strong>Lý do hủy:</strong> {cancelReason}
                                                                            {canceledAt && ` - ${formatDate(canceledAt)}`}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            Đơn hàng này đã bị hủy.
                                                                            {canceledAt && ` (${formatDate(canceledAt)})`}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                {/* Common information */}
                                                <div className="expanded-sections-grid">
                                                    <div className="expanded-section">
                                                        <h4>
                                                            <MapPin className="section-icon" />
                                                            Thông tin giao hàng
                                                        </h4>
                                                        <div className="expanded-details">
                                                            {phoneNumber && (
                                                                <div className="expanded-detail-row">
                                                                    <Phone className="expanded-icon" />
                                                                    <div>
                                                                        <div className="expanded-label">Số điện thoại</div>
                                                                        <div className="expanded-text">{phoneNumber}</div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {shippingAddress ? (
                                                                <div className="expanded-detail-row">
                                                                    <MapPin className="expanded-icon" />
                                                                    <div>
                                                                        <div className="expanded-label">Địa chỉ giao hàng</div>
                                                                        <div className="expanded-text">{shippingAddress}</div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="expanded-detail-row">
                                                                    <MapPin className="expanded-icon" />
                                                                    <div className="expanded-text text-muted">Chưa cập nhật địa chỉ</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="expanded-section">
                                                        <h4>
                                                            <CreditCard className="section-icon" />
                                                            Thanh toán
                                                        </h4>
                                                        <div className="expanded-details">
                                                            <div className="expanded-detail-row">
                                                                <CreditCard className="expanded-icon" />
                                                                <div>
                                                                    <div className="expanded-label">Phương thức thanh toán</div>
                                                                    <div className="expanded-text">
                                                                        {order._raw?.paymentMethod || (order.status === 'confirmed' ? 'Ví điện tử' : order.status === 'delivered' ? 'Ví điện tử' : 'Thanh toán khi nhận hàng (COD)')}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="expanded-detail-row">
                                                                <div className="expanded-label">Tổng tiền</div>
                                                                <div className="expanded-text price-highlight">{formatCurrency(order.finalPrice)}</div>
                                                            </div>
                                                            <div className="expanded-detail-row price-breakdown">
                                                                <div className="expanded-label">Tạm tính</div>
                                                                <div className="expanded-text">{formatCurrency(order.price || order.finalPrice - order.shippingFee)}</div>
                                                            </div>
                                                            <div className="expanded-detail-row price-breakdown">
                                                                <div className="expanded-label">Phí vận chuyển</div>
                                                                <div className="expanded-text">{formatCurrency(order.shippingFee)}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="expanded-section timeline-section">
                                                    <h4>
                                                        <Calendar className="section-icon" />
                                                        Mốc thời gian
                                                    </h4>
                                                    <div className="timeline">
                                                        <div className="timeline-item active">
                                                            <div className="timeline-dot"></div>
                                                            <div className="timeline-content">
                                                                <div className="timeline-label">Đặt hàng</div>
                                                                <div className="timeline-date">{formatDate(order.createdAt)}</div>
                                                            </div>
                                                        </div>
                                                        {order.status !== 'pending' && !isCancelled && (
                                                            <div className="timeline-item active">
                                                                <div className="timeline-dot"></div>
                                                                <div className="timeline-content">
                                                                    <div className="timeline-label">Xác nhận đơn hàng</div>
                                                                    <div className="timeline-date">{formatDate(order.updatedAt || order.createdAt)}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {(order.status === 'shipping' || order.status === 'delivered') && (
                                                            <div className="timeline-item active">
                                                                <div className="timeline-dot"></div>
                                                                <div className="timeline-content">
                                                                    <div className="timeline-label">Đang vận chuyển</div>
                                                                    <div className="timeline-date">{formatDate(order._raw?.shippedAt || order.updatedAt || order.createdAt)}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {order.status === 'delivered' && (
                                                            <div className="timeline-item active">
                                                                <div className="timeline-dot delivered"></div>
                                                                <div className="timeline-content">
                                                                    <div className="timeline-label">Giao hàng thành công</div>
                                                                    <div className="timeline-date">{formatDate(order._raw?.deliveredAt || order.updatedAt)}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {isCancelled && (
                                                            <div className="timeline-item cancelled">
                                                                <div className="timeline-dot cancelled"></div>
                                                                <div className="timeline-content">
                                                                    <div className="timeline-label">Đơn hàng bị hủy</div>
                                                                    <div className="timeline-date">
                                                                        {formatDate(canceledAt || order.updatedAt || order.createdAt)}
                                                                    </div>
                                                                    {cancelReason && (
                                                                        <div className="timeline-reason" style={{
                                                                            marginTop: '4px',
                                                                            fontSize: '12px',
                                                                            color: '#dc3545',
                                                                            fontStyle: 'italic'
                                                                        }}>
                                                                            {cancelReason}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
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
