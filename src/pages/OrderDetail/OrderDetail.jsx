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
    RefreshCw
} from 'lucide-react';
import './OrderDetail.css';

function OrderDetail() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Mock data - trong thực tế sẽ fetch từ API
    const mockOrderData = {
        id: orderId,
        order_code: 'GT-20250126-0001',
        order_status: 'PAID',
        created_at: '2025-01-26T10:30:00Z',
        paid_at: '2025-01-26T10:32:00Z',
        shipped_at: null,
        delivered_at: null,
        cancelled_at: null,
        cancel_reason: '',

        // Thông tin sản phẩm
        product: {
            id: 1,
            name: 'Pin xe đạp điện 48V 20Ah',
            price: 2500000,
            image: '/src/assets/imgs_pin/Pin-xe-dap-dien-Bridgestone-36V-10Ah-600x600.jpg',
            quantity: 1
        },

        // Thông tin người mua
        buyer: {
            name: 'Nguyễn Văn A',
            email: 'nguyenvana@email.com',
            phone: '0123456789'
        },

        // Thông tin giao hàng
        shipping: {
            address: '123 Đường ABC, Phường XYZ, Quận 1, TP.HCM',
            phone: '0123456789',
            partner: 'Giao hàng nhanh',
            tracking_number: 'GHN123456789',
            fee: 50000,
            note: 'Giao trong giờ hành chính'
        },

        // Thông tin thanh toán
        payment: {
            method: 'WALLET',
            transaction_id: 'TXN20250126001',
            amount: 2550000,
            paid_at: '2025-01-26T10:32:00Z'
        },

        // Thông tin hóa đơn
        invoice: {
            need_invoice: true,
            company_name: 'Công ty ABC',
            tax_code: '0123456789'
        }
    };

    useEffect(() => {
        // Simulate API call
        const loadOrderDetail = async () => {
            try {
                setLoading(true);
                // Trong thực tế sẽ gọi API: const response = await orderApi.getOrderDetail(orderId);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
                setOrderData(mockOrderData);
            } catch (err) {
                setError('Không thể tải thông tin đơn hàng');
                console.error('Error loading order detail:', err);
            } finally {
                setLoading(false);
            }
        };

        loadOrderDetail();
    }, [orderId]);

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
                        </div>
                    </div>
                </div>

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
                </div>
            </div>
        </div>
    );
}

export default OrderDetail;
