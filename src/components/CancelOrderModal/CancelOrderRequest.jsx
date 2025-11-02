import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './CancelOrderRequest.css';
import { getCancelReasons, cancelOrder, getOrderHistory } from '@/api/orderApi';

const CancelOrderRequest = () => {
    const navigate = useNavigate();
    const { orderId } = useParams();
    const [selectedReason, setSelectedReason] = useState(null);
    const [reasons, setReasons] = useState([]);
    const [showReasonList, setShowReasonList] = useState(false);
    const [loading, setLoading] = useState(false);
    const [orderData, setOrderData] = useState(null);

    // --- Lấy danh sách lý do hủy ---
    useEffect(() => {
        const fetchReasons = async () => {
            try {
                const data = await getCancelReasons();
                const mapped = data.map(r => ({
                    id: r.id,
                    text: r.cancelOrderReasonName
                }));
                setReasons(mapped);
            } catch (err) {
                console.error('❌ Lỗi khi tải lý do hủy:', err);
                alert('Không thể tải danh sách lý do hủy đơn. Vui lòng thử lại sau.');
            }
        };
        fetchReasons();
    }, []);

    // --- Lấy thông tin đơn hàng ---
    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await getOrderHistory({ page: 1, size: 20 });
                const orders = res?.data?.orderResponses || [];
                const found = orders.find(o => String(o.id) === String(orderId));

                if (found) {
                    setOrderData({
                        id: found.id,
                        orderCode: found.orderCode,
                        status: found.status,
                        shippingAddress: found.shippingAddress,
                        phoneNumber: found.phoneNumber,
                        totalAmount: found.price + found.shippingFee,
                        price: found.price,
                        shippingFee: found.shippingFee,
                        paymentMethod: found.paymentMethod || 'COD',
                    });
                } else {
                    alert('Không tìm thấy thông tin đơn hàng.');
                    navigate(-1);
                }
            } catch (err) {
                console.error(' Lỗi khi tải dữ liệu đơn hàng:', err);
                alert('Không thể tải dữ liệu đơn hàng. Vui lòng thử lại sau.');
            }
        };
        fetchOrder();
    }, [orderId]);

    // --- Chọn lý do ---
    const handleReasonSelect = (reason) => {
        setSelectedReason(reason);
        setShowReasonList(false);
    };

    // --- Gửi yêu cầu hủy ---
    const handleSubmit = async () => {
        if (!selectedReason) {
            alert('Vui lòng chọn lý do hủy đơn');
            return;
        }

        if (!orderId) {
            alert('Không tìm thấy mã đơn hàng');
            return;
        }

        try {
            setLoading(true);
            const payload = { reasonId: selectedReason.id };
            const res = await cancelOrder(orderId, payload);

            if (res?.success) {
                alert(' Đã gửi yêu cầu hủy đơn thành công!');
                navigate(-1);
            } else {
                alert('❌ Gửi yêu cầu thất bại. Vui lòng thử lại.');
            }
        } catch (err) {
            console.error(' Lỗi khi gửi yêu cầu hủy đơn:', err);
            alert('Không thể gửi yêu cầu hủy đơn. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    // --- Format tiền ---
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount || 0);
    };

    if (!orderData) {
        return <p style={{ textAlign: 'center', marginTop: '2rem' }}>Đang tải đơn hàng...</p>;
    }

    return (
        <div className="cancel-order-container">
            <header className="cancel-order-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                <h1 className="header-title">Yêu cầu hủy đơn</h1>
            </header>

            <div className="order-info">
                <div className="product-details">
                    <p className="order-number">Đơn hàng #{orderData.orderCode}</p>
                    <p className="product-name">Tổng tiền: {formatCurrency(orderData.totalAmount)}</p>
                    <p className="product-name">Trạng thái: {orderData.status}</p>
                </div>
            </div>

            <div className="form-section">
                <label className="form-label">
                    Lý do hủy: <span className="required">*</span>
                </label>

                {!selectedReason ? (
                    <div
                        className="reason-selector"
                        onClick={() => setShowReasonList(!showReasonList)}
                    >
                        <span className="placeholder-text">Chọn lý do</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                            className={showReasonList ? 'arrow-icon rotate' : 'arrow-icon'}>
                            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                ) : (
                    <div
                        className="selected-reason-display"
                        onClick={() => setShowReasonList(true)}
                    >
                        <span className="selected-reason-text">{selectedReason.text}</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="arrow-right">
                            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                )}

                {showReasonList && (
                    <div className="reason-list">
                        {reasons.map((reason) => (
                            <div
                                key={reason.id}
                                className="reason-item"
                                onClick={() => handleReasonSelect(reason)}
                            >
                                <div className="radio-button">
                                    {selectedReason?.id === reason.id && <div className="radio-checked" />}
                                </div>
                                <span className="reason-text">{reason.text}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="refund-section">
                <h3 className="refund-title">Số tiền hoàn lại</h3>

                {(!orderData.paymentMethod || orderData.paymentMethod === 'COD') ? (
                    <div className="refund-info">
                        <p className="refund-amount">Không hoàn tiền</p>
                        <p className="refund-note">
                            Bạn đã chọn phương thức thanh toán khi nhận hàng (COD)
                        </p>
                    </div>
                ) : (
                    <div className="refund-info">
                        <p className="refund-amount">
                            {formatCurrency(orderData.totalAmount)}
                        </p>
                    </div>
                )}
            </div>

            {/* 🔹 Ghi chú chỉ hiển thị nếu là COD */}
            {(!orderData.paymentMethod || orderData.paymentMethod === 'COD') && (
                <div className="info-note">
                    <p>
                        Sau khi 'Xác nhận', GreenTrade sẽ liên hệ đơn vị vận chuyển để dừng giao đơn hàng này.
                    </p>
                </div>
            )}

            <button
                className="submit-button"
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>

        </div>
    );
};

export default CancelOrderRequest;
