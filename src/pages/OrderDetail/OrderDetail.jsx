import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { getOrderDetails, getOrderStatus } from '../../api/orderApi';
import './OrderDetail.css';

function OrderDetail() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadOrderDetail = async () => {
            try {
                setLoading(true);
                const res = await getOrderDetails(orderId);
                const data = res?.data || res;

                // Chuẩn hóa dữ liệu chi tiết đơn
                const normalized = {
                    id: data.id || data.orderId || orderId,
                    order_code: data.orderCode || data.code || String(orderId),
                    order_status: String(data.status || data.order_status || 'PROCESSING').toUpperCase(),
                    created_at: data.createdAt || data.created_at || null,
                    paid_at: data.paidAt || data.paid_at || null,
                    shipped_at: data.shippedAt || data.shipped_at || data.deliveringAt || null,
                    delivered_at: data.deliveredAt || data.delivered_at || null,
                    cancelled_at: data.cancelledAt || data.cancelled_at || null,
                    cancel_reason: data.cancelReason || data.cancel_reason || '',

                    product: {
                        id: data.product?.id,
                        name: data.product?.name || data.productName || 'Sản phẩm',
                        price: Number(data.product?.price ?? data.price ?? 0),
                        image: data.product?.image || '/vite.svg',
                        quantity: Number(data.product?.quantity ?? data.quantity ?? 1)
                    },

                    buyer: {
                        name: data.buyer?.name || data.customerName || 'Người mua',
                        email: data.buyer?.email || '',
                        phone: data.buyer?.phone || ''
                    },

                    shipping: {
                        address: data.shipping?.address || data.shippingAddress || 'Chưa cập nhật',
                        phone: data.shipping?.phone || data.receiverPhone || '',
                        partner: data.shipping?.partner || data.shippingPartner || 'Đối tác vận chuyển',
                        tracking_number: data.shipping?.trackingNumber || data.trackingNumber || '-',
                        fee: Number(data.shipping?.fee ?? data.shippingFee ?? 0),
                        note: data.shipping?.note || data.note || ''
                    },

                    payment: {
                        method: String(data.payment?.method || data.paymentMethod || 'WALLET').toUpperCase(),
                        transaction_id: data.payment?.transactionId || data.transactionId || '-',
                        amount: Number(data.payment?.amount ?? data.totalAmount ?? data.finalPrice ?? 0),
                        paid_at: data.payment?.paidAt || data.paidAt || data.paid_at || null
                    },

                    invoice: {
                        need_invoice: Boolean(data.invoice?.needInvoice || data.needInvoice || false),
                        company_name: data.invoice?.companyName || '',
                        tax_code: data.invoice?.taxCode || ''
                    }
                };

                setOrderData(normalized);

                // Cập nhật trạng thái từ API shipping status
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

                            setOrderData(prevData => ({
                                ...prevData,
                                order_status: backendStatus
                            }));
                        }
                    } catch (error) {
                        console.warn('[OrderDetail] Failed to get order status from API:', error);
                        // Giữ nguyên trạng thái hiện tại nếu API fail
                    }
                }
            } catch (err) {
                setError('Không thể tải thông tin đơn hàng');
                console.error('Error loading order detail:', err);
            } finally {
                setLoading(false);
            }
        };

        loadOrderDetail();
    }, [orderId]);

    // Auto-refresh order status định kỳ (mỗi 30 giây)
    useEffect(() => {
        if (!orderData) return;

        const refreshStatus = async () => {
            try {
                const realOrderId = orderData.id;
                if (!realOrderId) return;

                console.log('[OrderDetail] Auto-refreshing order status...');
                const statusResponse = await getOrderStatus(realOrderId);

                if (statusResponse.success && statusResponse.status) {
                    const statusMap = {
                        'pending': 'PENDING_PAYMENT',
                        'confirmed': 'PROCESSING',
                        'shipping': 'SHIPPED',
                        'delivered': 'DELIVERED',
                        'cancelled': 'CANCELLED'
                    };
                    const backendStatus = statusMap[statusResponse.status] || statusResponse.rawStatus || orderData.order_status;

                    if (backendStatus !== orderData.order_status) {
                        console.log(`[OrderDetail] Status updated: ${orderData.order_status} -> ${backendStatus}`);
                        setOrderData(prevData => ({
                            ...prevData,
                            order_status: backendStatus
                        }));
                    }
                }
            } catch (error) {
                console.warn('[OrderDetail] Failed to refresh order status:', error);
            }
        };

        // Refresh ngay khi orderData được load
        if (orderData.id) {
            refreshStatus();
        }

        // Set interval để refresh mỗi 30 giây
        const intervalId = setInterval(refreshStatus, 30000); // 30 seconds

        return () => clearInterval(intervalId);
    }, [orderData?.id]); // Chỉ chạy khi orderId thay đổi

    // Hàm format trạng thái đơn hàng
    const getOrderStatusText = (status) => {
        const statusMap = {
            'PENDING_PAYMENT': 'Chờ thanh toán',
            'PAID': 'Đã thanh toán',
            'PROCESSING': 'Đang xử lý',
            'SHIPPED': 'Đã giao cho đơn vị vận chuyển',
            'DELIVERED': 'Đã giao thành công',
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

    const isDelivered = String(orderData?.order_status || '').toUpperCase() === 'DELIVERED';

    if (loading) {
        return (
            <div className="order-detail-page">
                <div className="order-detail-container">
                    <div className="loading-state">
                        <RefreshCw className="loading-icon" />
                        <p>Đang tải thông tin đơn hàng...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
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
        );
    }

    if (!orderData) {
        return (
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
        );
    }

    return (
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
                            <button
                                className="btn btn-warning"
                                onClick={() => alert('Khiếu nại đơn hàng (sẽ triển khai)')}
                            >
                                <MessageSquareWarning style={{ marginRight: 6 }} /> Khiếu nại
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={() => alert('Đánh giá đơn hàng (sẽ triển khai)')}
                            >
                                <Star style={{ marginRight: 6 }} /> Đánh giá
                            </button>
                            <button
                                className="btn btn-soft"
                                onClick={() => alert('Tải hóa đơn PDF (sẽ triển khai)')}
                            >
                                <FileDown style={{ marginRight: 6 }} /> Tải hóa đơn
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OrderDetail;
