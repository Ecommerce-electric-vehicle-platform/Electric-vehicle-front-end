import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft,
    Package,
    User,
    MapPin,
    Phone,
    CreditCard,
    Truck,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    RefreshCw,
    FileDown,
    Star,
    MessageSquareWarning
} from 'lucide-react';
import { getOrderDetails, getOrderStatus, hasOrderReview, confirmOrderDelivery } from '../../api/orderApi';
import { Toast } from '../../components/Toast/Toast';
import './OrderDetail.css';

function OrderDetail() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasReview, setHasReview] = useState(false); // Trạng thái đánh giá
    const [confirming, setConfirming] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const showToastMessage = (message) => {
        if (!message) return;
        setToastMessage(message);
        setShowToast(true);
    };

    const toastPortal = (
        <Toast
            message={toastMessage}
            show={showToast}
            onClose={() => setShowToast(false)}
        />
    );

    useEffect(() => {
        const loadOrderDetail = async () => {
            try {
                setLoading(true);
                setError(null);

                // Gọi API order detail
                const res = await getOrderDetails(orderId);

                if (!res.success || !res.data) {
                    throw new Error(res.message || 'Không thể tải thông tin đơn hàng');
                }

                const orderDetailData = res.data;

                // Chuẩn hóa dữ liệu chi tiết đơn từ API response
                const normalized = {
                    id: orderDetailData.id || orderId,
                    order_code: orderDetailData.orderCode || String(orderId),
                    order_status: orderDetailData.rawStatus || 'PROCESSING', // Giữ rawStatus từ backend
                    created_at: orderDetailData.createdAt || null,
                    updated_at: orderDetailData.updatedAt || null,
                    cancelled_at: orderDetailData.canceledAt || null,
                    cancel_reason: orderDetailData.cancelReason || '',

                    // Map normalized status để hiển thị
                    normalized_status: orderDetailData.status || 'pending',

                    // Thông tin giá
                    price: orderDetailData.price || 0,
                    shipping_fee: orderDetailData.shippingFee || 0,
                    final_price: orderDetailData.finalPrice || (orderDetailData.price + orderDetailData.shippingFee),

                    // Product info - API không trả product details, dùng placeholder
                    product: {
                        id: orderDetailData._raw?.productId || null,
                        name: orderDetailData._raw?.productName || 'Sản phẩm',
                        price: orderDetailData.price || 0,
                        image: orderDetailData._raw?.productImage || '/vite.svg',
                        quantity: orderDetailData._raw?.quantity || 1
                    },

                    // Buyer info - API không trả buyer details, dùng placeholder
                    buyer: {
                        name: orderDetailData._raw?.buyerName || 'Người mua',
                        email: orderDetailData._raw?.buyerEmail || '',
                        phone: orderDetailData.phoneNumber || ''
                    },

                    // Shipping info
                    shipping: {
                        address: orderDetailData.shippingAddress || 'Chưa cập nhật',
                        phone: orderDetailData.phoneNumber || '',
                        partner: orderDetailData._raw?.shippingPartner || orderDetailData._raw?.carrier || 'Đối tác vận chuyển',
                        tracking_number: orderDetailData._raw?.trackingNumber || orderDetailData._raw?.trackingNumber || '-',
                        fee: orderDetailData.shippingFee || 0,
                        note: orderDetailData._raw?.note || ''
                    },

                    // Payment info - API không trả payment details, dùng default
                    payment: {
                        method: orderDetailData._raw?.paymentMethod || 'WALLET',
                        transaction_id: orderDetailData._raw?.transactionId || '-',
                        amount: orderDetailData.finalPrice || 0,
                        paid_at: orderDetailData._raw?.paidAt || null
                    },

                    // Invoice info - API không trả invoice details
                    invoice: {
                        need_invoice: Boolean(orderDetailData._raw?.needInvoice || false),
                        company_name: orderDetailData._raw?.companyName || '',
                        tax_code: orderDetailData._raw?.taxCode || ''
                    }
                };

                setOrderData(normalized);

                // Sau khi load order detail, cập nhật status từ shipping API để có status mới nhất
                const realOrderId = normalized.id;
                if (realOrderId) {
                    try {
                        const statusResponse = await getOrderStatus(realOrderId);
                        if (statusResponse.success && statusResponse.status) {
                            // Map frontend status back to backend status format
                            const statusMap = {
                                'pending': 'PENDING_PAYMENT',
                                'confirmed': 'PROCESSING',
                                'shipping': 'SHIPPED',
                                'delivered': 'DELIVERED',
                                'cancelled': 'CANCELLED'
                            };
                            const backendStatus = statusMap[statusResponse.status] || statusResponse.rawStatus || normalized.order_status;
                            const currentStatus = normalized.normalized_status || (normalized.order_status && normalized.order_status.includes('DELIVERED') ? 'delivered' : null);

                            setOrderData(prevData => ({
                                ...prevData,
                                order_status: backendStatus,
                                normalized_status: statusResponse.status
                            }));

                            // Nếu đơn hàng đã giao, kiểm tra xem đã có đánh giá chưa
                            if (statusResponse.status === 'delivered') {
                                try {
                                    const reviewStatus = await hasOrderReview(realOrderId);
                                    setHasReview(reviewStatus);
                                } catch (reviewError) {
                                    console.warn('[OrderDetail] Failed to check review status:', reviewError);
                                }
                            } else {
                                setHasReview(false);
                            }
                        } else {
                            // Nếu không lấy được status từ shipping API nhưng order status từ order detail là DELIVERED
                            const orderStatusUpper = String(normalized.order_status || '').toUpperCase();
                            if (orderStatusUpper === 'DELIVERED' || normalized.normalized_status === 'delivered') {
                                try {
                                    const reviewStatus = await hasOrderReview(realOrderId);
                                    setHasReview(reviewStatus);
                                } catch (reviewError) {
                                    console.warn('[OrderDetail] Failed to check review status:', reviewError);
                                }
                            }
                        }
                    } catch (error) {
                        console.warn('[OrderDetail] Failed to get order status from API:', error);
                        // Nếu API fail nhưng order status là DELIVERED, vẫn check review
                        const orderStatusUpper = String(normalized.order_status || '').toUpperCase();
                        if (orderStatusUpper === 'DELIVERED' || normalized.normalized_status === 'delivered') {
                            try {
                                const reviewStatus = await hasOrderReview(realOrderId);
                                setHasReview(reviewStatus);
                            } catch (reviewError) {
                                console.warn('[OrderDetail] Failed to check review status:', reviewError);
                            }
                        }
                    }
                }
            } catch (err) {
                setError(err.message || 'Không thể tải thông tin đơn hàng');
                console.error('[OrderDetail] Error loading order detail:', err);
            } finally {
                setLoading(false);
            }
        };

        loadOrderDetail();
    }, [orderId]);

    // Auto-refresh order details định kỳ (mỗi 30 giây) để luôn có dữ liệu mới nhất
    useEffect(() => {
        if (!orderData || !orderId) return;

        const refreshOrderDetail = async () => {
            try {
                const realOrderId = orderData.id || orderId;
                if (!realOrderId) return;

                console.log('[OrderDetail] Auto-refreshing order details...');

                // Gọi API order detail để lấy thông tin mới nhất
                const res = await getOrderDetails(realOrderId);

                if (res.success && res.data) {
                    const orderDetailData = res.data;

                    // Cập nhật các trường có thể thay đổi
                    setOrderData(prevData => {
                        if (!prevData) return prevData;

                        // So sánh để chỉ update nếu có thay đổi
                        const statusChanged = orderDetailData.rawStatus !== prevData.order_status;
                        const cancelStatusChanged = Boolean(orderDetailData.canceledAt) !== Boolean(prevData.cancelled_at);

                        if (statusChanged || cancelStatusChanged) {
                            console.log(`[OrderDetail] Order data updated: status=${orderDetailData.rawStatus}, canceledAt=${orderDetailData.canceledAt}`);

                            return {
                                ...prevData,
                                order_status: orderDetailData.rawStatus || prevData.order_status,
                                normalized_status: orderDetailData.status || prevData.normalized_status,
                                cancelled_at: orderDetailData.canceledAt || prevData.cancelled_at,
                                cancel_reason: orderDetailData.cancelReason || prevData.cancel_reason,
                                updated_at: orderDetailData.updatedAt || prevData.updated_at,
                                price: orderDetailData.price ?? prevData.price,
                                shipping_fee: orderDetailData.shippingFee ?? prevData.shipping_fee,
                                final_price: orderDetailData.finalPrice ?? prevData.final_price,
                                shipping: {
                                    ...prevData.shipping,
                                    address: orderDetailData.shippingAddress || prevData.shipping.address,
                                    phone: orderDetailData.phoneNumber || prevData.shipping.phone,
                                    fee: orderDetailData.shippingFee ?? prevData.shipping.fee
                                }
                            };
                        }

                        return prevData;
                    });
                }

                // Sau đó cập nhật status từ shipping API
                try {
                    const statusResponse = await getOrderStatus(realOrderId);
                    if (statusResponse.success && statusResponse.status) {
                        const statusMap = {
                            'pending': 'PENDING_PAYMENT',
                            'confirmed': 'PROCESSING',
                            'shipping': 'SHIPPED',
                            'delivered': 'DELIVERED',
                            'cancelled': 'CANCELLED'
                        };
                        const backendStatus = statusMap[statusResponse.status] || statusResponse.rawStatus;

                        setOrderData(prevData => {
                            if (!prevData || prevData.order_status === backendStatus) {
                                // Nếu status không thay đổi nhưng là delivered, vẫn check review status
                                if (statusResponse.status === 'delivered') {
                                    const realId = prevData.id || orderId;
                                    hasOrderReview(realId).then(setHasReview).catch(console.warn);
                                }
                                return prevData;
                            }

                            console.log(`[OrderDetail] Status updated from shipping API: ${prevData.order_status} -> ${backendStatus}`);
                            const updatedData = {
                                ...prevData,
                                order_status: backendStatus,
                                normalized_status: statusResponse.status
                            };

                            // Nếu đơn hàng đã giao, kiểm tra xem đã có đánh giá chưa
                            if (statusResponse.status === 'delivered') {
                                const realId = updatedData.id || orderId;
                                hasOrderReview(realId).then(setHasReview).catch(console.warn);
                            } else {
                                setHasReview(false);
                            }

                            return updatedData;
                        });
                    }
                } catch (statusError) {
                    console.warn('[OrderDetail] Failed to refresh status from shipping API:', statusError);
                }
            } catch (error) {
                console.warn('[OrderDetail] Failed to refresh order details:', error);
            }
        };

        // Refresh ngay khi orderData được load
        if (orderData.id) {
            refreshOrderDetail();
        }

        // Set interval để refresh mỗi 30 giây
        const intervalId = setInterval(refreshOrderDetail, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [orderData?.id, orderId]); // Chỉ chạy khi orderId thay đổi

    // Hàm format trạng thái đơn hàng
    const getOrderStatusText = (status) => {
        const statusMap = {
            'PENDING_PAYMENT': 'Chờ thanh toán',
            'PAID': 'Đã thanh toán',
            'PROCESSING': 'Đang xử lý',
            'SHIPPED': 'Đã giao cho đơn vị vận chuyển',
            'DELIVERED': 'Đã giao thành công',
            'COMPLETED': 'Đã hoàn tất',
            'SUCCESS': 'Đã hoàn tất',
            'CANCELLED': 'Đã hủy',
            'RETURN_REQUESTED': 'Yêu cầu hoàn hàng',
            'REFUNDED': 'Đã hoàn tiền'
        };
        return statusMap[status] || status;
    };

    // Hàm format phương thức thanh toán
    const getPaymentMethodText = (method) => {
        const methodMap = {
            'WALLET': 'Ví điện tử',
            'COD': 'Thanh toán khi nhận hàng',
            'VNPAY': 'VnPay',
            'BANKING': 'Chuyển khoản ngân hàng',
            'MOMO': 'Ví MoMo'
        };
        return methodMap[method] || method;
    };

    // Hàm format thời gian
    const formatDateTime = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    // Hàm format tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Xử lý đánh giá đơn hàng
    const handleRateOrder = () => {
        const realId = orderData?.id || orderId;
        navigate(`/order/review/${orderId}`, {
            state: {
                orderIdRaw: realId,
                orderCode: orderData?.order_code || null,
                from: location.pathname // Sử dụng đường dẫn thực tế hiện tại
            }
        });
    };

    // Xử lý xem đánh giá đã có
    const handleViewReview = () => {
        const realId = orderData?.id || orderId;
        navigate(`/order/review/${orderId}`, {
            state: {
                orderIdRaw: realId,
                orderCode: orderData?.order_code || null,
                viewMode: true, // Đánh dấu là chế độ xem lại
                from: location.pathname // Sử dụng đường dẫn thực tế hiện tại
            }
        });
    };

    const handleConfirmOrder = async () => {
        const realOrderId = orderData?.id || orderId;
        if (!realOrderId || confirming) return;

        setConfirming(true);
        try {
            const response = await confirmOrderDelivery(realOrderId);
            const success = response?.success !== false;
            if (!success) {
                throw new Error(response?.message || 'Xác nhận đơn hàng thất bại');
            }

            showToastMessage('Đơn hàng đã được xác nhận thành công!');

            setOrderData(prev => {
                if (!prev) return prev;
                const nextRawStatus = response?.rawStatus || 'COMPLETED';
                return {
                    ...prev,
                    order_status: nextRawStatus,
                    normalized_status: 'delivered',
                    updated_at: new Date().toISOString(),
                    _raw: {
                        ...(prev._raw || {}),
                        status: nextRawStatus,
                        orderStatus: nextRawStatus,
                        rawStatus: nextRawStatus
                    }
                };
            });
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || 'Không thể xác nhận đơn hàng.';
            showToastMessage(message);
            console.error('[OrderDetail] Failed to confirm order:', err);
        } finally {
            setConfirming(false);
        }
    };

    // Hàm lấy icon trạng thái
    const getStatusIcon = (status) => {
        switch (status) {
            case 'PENDING_PAYMENT':
                return <Clock className="status-icon pending" />;
            case 'PAID':
                return <CheckCircle className="status-icon paid" />;
            case 'PROCESSING':
                return <RefreshCw className="status-icon processing" />;
            case 'SHIPPED':
                return <Truck className="status-icon shipped" />;
            case 'DELIVERED':
                return <CheckCircle className="status-icon delivered" />;
            case 'CANCELLED':
                return <XCircle className="status-icon cancelled" />;
            default:
                return <AlertCircle className="status-icon" />;
        }
    };

    const orderStatusUpper = String(orderData?.order_status || '').toUpperCase();
    const normalizedStatusLower = String(orderData?.normalized_status || '').toLowerCase();
    const isOrderCompleted = ['COMPLETED', 'SUCCESS'].includes(orderStatusUpper);
    const isDelivered = normalizedStatusLower === 'delivered' || ['DELIVERED', 'COMPLETED', 'SUCCESS'].includes(orderStatusUpper);
    const canConfirmOrder = orderStatusUpper === 'DELIVERED' && !isOrderCompleted;

    if (loading) {
        return (
            <>
                {toastPortal}
                <div className="order-detail-page">
                    <div className="order-detail-container">
                        <div className="loading-state">
                            <RefreshCw className="loading-icon" />
                            <p>Đang tải thông tin đơn hàng...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                {toastPortal}
                <div className="order-detail-page">
                    <div className="order-detail-container">
                        <div className="error-state">
                            <AlertCircle className="error-icon" />
                            <p>{error}</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.reload()}
                            >
                                Thử lại
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!orderData) {
        return (
            <>
                {toastPortal}
                <div className="order-detail-page">
                    <div className="order-detail-container">
                        <div className="not-found-state">
                            <Package className="not-found-icon" />
                            <p>Không tìm thấy đơn hàng</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/orders')}
                            >
                                Quay lại danh sách đơn hàng
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {toastPortal}
            <div className="order-detail-page">
            <div className="order-detail-container">
                {/* Header */}
                <div className="order-detail-header">
                    <button
                        className="back-btn"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={20} />
                        Quay lại
                    </button>
                    <h1>Chi tiết đơn hàng</h1>
                </div>

                {/* Order Status Banner */}
                <div className="order-status-banner">
                    <div className="status-info">
                        {getStatusIcon(orderData.order_status)}
                        <div className="status-details">
                            <h3>{getOrderStatusText(orderData.order_status)}</h3>
                            <p>Mã đơn hàng: <span className="order-code">{orderData.order_code}</span></p>
                            {isDelivered && (
                                <p>Đã giao lúc: <strong>{formatDateTime(orderData.delivered_at)}</strong></p>
                            )}
                        </div>
                    </div>
                </div>

                {isDelivered && (
                    <div className="timeline-section">
                        <h2>Tiến trình giao hàng</h2>
                        <div className="timeline">
                            <div className="timeline-item done">
                                <Clock />
                                <div>
                                    <div>Đặt hàng</div>
                                    <small>{formatDateTime(orderData.created_at)}</small>
                                </div>
                            </div>
                            <div className="timeline-item done">
                                <CheckCircle />
                                <div>
                                    <div>Thanh toán</div>
                                    <small>{formatDateTime(orderData.paid_at)}</small>
                                </div>
                            </div>
                            <div className="timeline-item done">
                                <Truck />
                                <div>
                                    <div>Bàn giao vận chuyển</div>
                                    <small>{formatDateTime(orderData.shipped_at)}</small>
                                </div>
                            </div>
                            <div className="timeline-item done">
                                <CheckCircle />
                                <div>
                                    <div>Giao thành công</div>
                                    <small>{formatDateTime(orderData.delivered_at)}</small>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Information */}
                <div className="order-info-section">
                    <h2>Thông tin đơn hàng</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Mã đơn hàng:</span>
                            <span className="info-value order-code">{orderData.order_code}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Trạng thái:</span>
                            <span className="info-value order-status" data-status={orderData.order_status}>
                                {getOrderStatusText(orderData.order_status)}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Thời gian tạo:</span>
                            <span className="info-value">{formatDateTime(orderData.created_at)}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Thời gian thanh toán:</span>
                            <span className="info-value">{formatDateTime(orderData.paid_at)}</span>
                        </div>
                        {orderData.shipped_at && (
                            <div className="info-item">
                                <span className="info-label">Thời gian giao cho vận chuyển:</span>
                                <span className="info-value">{formatDateTime(orderData.shipped_at)}</span>
                            </div>
                        )}
                        {orderData.delivered_at && (
                            <div className="info-item">
                                <span className="info-label">Thời gian giao thành công:</span>
                                <span className="info-value">{formatDateTime(orderData.delivered_at)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Information */}
                <div className="product-info-section">
                    <h2>Thông tin sản phẩm</h2>
                    <div className="product-card">
                        <img
                            src={orderData.product.image}
                            alt={orderData.product.name}
                            className="product-image"
                        />
                        <div className="product-details">
                            <h3>{orderData.product.name}</h3>
                            <p className="product-price">{formatCurrency(orderData.product.price)}</p>
                            <p className="product-quantity">Số lượng: {orderData.product.quantity}</p>
                        </div>
                    </div>
                </div>

                {/* Buyer Information */}
                <div className="buyer-info-section">
                    <h2>Thông tin người mua</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Họ tên:</span>
                            <span className="info-value">{orderData.buyer.name}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{orderData.buyer.email}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Số điện thoại:</span>
                            <span className="info-value">{orderData.buyer.phone}</span>
                        </div>
                    </div>
                </div>

                {/* Shipping Information */}
                <div className="shipping-info-section">
                    <h2>Thông tin giao hàng</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Địa chỉ giao hàng:</span>
                            <span className="info-value">{orderData.shipping.address}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Số điện thoại nhận hàng:</span>
                            <span className="info-value">{orderData.shipping.phone}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Đối tác vận chuyển:</span>
                            <span className="info-value">{orderData.shipping.partner}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Mã vận đơn:</span>
                            <span className="info-value tracking-number">{orderData.shipping.tracking_number}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Phí vận chuyển:</span>
                            <span className="info-value">{formatCurrency(orderData.shipping.fee)}</span>
                        </div>
                        {orderData.shipping.note && (
                            <div className="info-item">
                                <span className="info-label">Ghi chú giao hàng:</span>
                                <span className="info-value">{orderData.shipping.note}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Payment Information */}
                <div className="payment-info-section">
                    <h2>Thông tin thanh toán</h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <span className="info-label">Phương thức thanh toán:</span>
                            <span className="info-value">{getPaymentMethodText(orderData.payment.method)}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Mã giao dịch:</span>
                            <span className="info-value transaction-id">{orderData.payment.transaction_id}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Số tiền thanh toán:</span>
                            <span className="info-value payment-amount">{formatCurrency(orderData.payment.amount)}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Thời gian thanh toán:</span>
                            <span className="info-value">{formatDateTime(orderData.payment.paid_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Invoice Information */}
                {orderData.invoice.need_invoice && (
                    <div className="invoice-info-section">
                        <h2>Thông tin hóa đơn</h2>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Xuất hóa đơn:</span>
                                <span className="info-value">Có</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Tên công ty:</span>
                                <span className="info-value">{orderData.invoice.company_name}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Mã số thuế:</span>
                                <span className="info-value">{orderData.invoice.tax_code}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="order-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/orders')}
                    >
                        Danh sách đơn hàng
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.print()}
                    >
                        In đơn hàng
                    </button>
                    {isDelivered && (
                        <>
                            {canConfirmOrder && (
                                <button
                                    className="btn btn-primary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmOrder();
                                    }}
                                    disabled={confirming}
                                >
                                    {confirming ? 'Đang xác nhận...' : 'Xác nhận đơn hàng'}
                                </button>
                            )}
                            <button
                                className="btn btn-warning"
                                onClick={() => alert('Khiếu nại đơn hàng (sẽ triển khai)')}
                            >
                                <MessageSquareWarning style={{ marginRight: 6 }} /> Khiếu nại
                            </button>
                            {hasReview ? (
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleViewReview}
                                >
                                    <Star style={{ marginRight: 6 }} /> Xem đánh giá
                                </button>
                            ) : (
                                <button
                                    className="btn btn-success"
                                    onClick={handleRateOrder}
                                >
                                    <Star style={{ marginRight: 6 }} /> Đánh giá
                                </button>
                            )}
                            {orderData?.invoice?.need_invoice && (
                                <button
                                    className="btn btn-soft"
                                    onClick={() => alert('Tải hóa đơn PDF (sẽ triển khai)')}
                                >
                                    <FileDown style={{ marginRight: 6 }} /> Tải hóa đơn
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
            </div>
        </>
    );
}

export default OrderDetail;
