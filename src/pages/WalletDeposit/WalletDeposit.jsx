import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Lock, AlertCircle } from "lucide-react";
import vnpayApi from "../../api/vnpayApi";
import momoApi from "../../api/momoApi";
import { useWalletBalance } from "../../hooks/useWalletBalance";
import MomoLoader from "../../components/Loader/MomoLoader";
import "./WalletDeposit.css";

const PAYMENT_METHODS = {
    VNPAY: "vnpay",
    MOMO: "momo",
};

export default function WalletDeposit() {
    const location = useLocation();
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.VNPAY);
    const { balance, formatCurrency } = useWalletBalance();

    // Lưu returnUrl và các thông tin đơn hàng từ location state hoặc localStorage
    useEffect(() => {
        const returnUrl = location.state?.returnUrl || localStorage.getItem('walletDepositReturnUrl');
        if (returnUrl && !localStorage.getItem('walletDepositReturnUrl')) {
            localStorage.setItem('walletDepositReturnUrl', returnUrl);
        }
        // Lưu product state nếu có
        if (location.state?.product && !localStorage.getItem('walletDepositProductState')) {
            localStorage.setItem('walletDepositProductState', JSON.stringify(location.state.product));
        }
        // Lưu orderData nếu có
        if (location.state?.orderData && !localStorage.getItem('walletDepositOrderData')) {
            localStorage.setItem('walletDepositOrderData', JSON.stringify(location.state.orderData));
        }
        // Lưu addressStates nếu có
        if (location.state?.addressStates && !localStorage.getItem('walletDepositAddressStates')) {
            localStorage.setItem('walletDepositAddressStates', JSON.stringify(location.state.addressStates));
        }
    }, [location.state]);

    // Quick amount options (in VND)
    const quickAmounts = [500000, 1000000, 2000000, 5000000];

    const handleQuickAmount = (quickAmount) => {
        setAmount(quickAmount.toString());
        setError("");
    };

    const formatInputAmount = (value) => {
        // Remove all non-digit characters
        const numericValue = value.replace(/\D/g, "");
        return numericValue;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        // 🧮 Kiểm tra số tiền nhập
        if (!amount || Number(amount) <= 0) {
            setError("Số tiền phải lớn hơn 0");
            return;
        }

        // 🔐 Kiểm tra token trước khi gọi API
        const token = localStorage.getItem("accessToken");
        if (!token) {
            setError("Vui lòng đăng nhập để nạp tiền.");
            return;
        }

        try {
            setLoading(true);

            let res;
            let payUrl;

            // 📡 Gọi API tạo URL thanh toán theo phương thức đã chọn
            if (paymentMethod === PAYMENT_METHODS.MOMO) {
                res = await momoApi.createPayment(Number(amount));
                console.log("MoMo response:", res.data);
                // MoMo trả về URL ở key url_payment (giống VNPay)
                payUrl =
                    res?.data?.data?.url_payment || // ✅ Key chính xác từ MoMo API
                    res?.data?.data?.paymentUrl ||
                    res?.data?.data?.url ||
                    res?.data?.paymentUrl ||
                    res?.data?.url;
            } else {
                res = await vnpayApi.createPayment(Number(amount));
                console.log("VNPay response:", res.data);
                // VNPay trả về URL ở key url_payment
                payUrl =
                    res?.data?.data?.url_payment ||
                    res?.data?.paymentUrl ||
                    res?.data?.data?.paymentUrl ||
                    res?.data?.url;
            }

            if (payUrl && typeof payUrl === "string") {
                console.log(`🔗 Redirecting to ${paymentMethod.toUpperCase()}:`, payUrl);
                window.location.href = payUrl;
            } else {
                setError("Không nhận được đường dẫn thanh toán");
                setLoading(false);
            }
        } catch (err) {
            console.error(`❌ Lỗi tạo thanh toán ${paymentMethod.toUpperCase()}:`, err);
            console.error("Error details:", {
                status: err?.response?.status,
                data: err?.response?.data,
                message: err?.message
            });
            
            // Hiển thị message từ backend hoặc message mặc định
            const errorMessage = 
                err?.response?.data?.message ||
                err?.response?.data?.error?.message ||
                err?.message ||
                "Tạo yêu cầu thanh toán thất bại. Vui lòng thử lại sau.";
            
            setError(errorMessage);
            setLoading(false);
        }
    };

    // Format amount for display
    const displayAmount = amount ? parseInt(amount).toLocaleString("vi-VN") : "0";

    return (
        <div className="wallet-deposit-page">
            {loading && <MomoLoader message="Đang tạo liên kết thanh toán..." />}
            
            <div className="wallet-deposit-header">
                <h1 className="page-title">Nạp tiền vào ví</h1>
                <p className="current-balance">
                    Số dư hiện tại của bạn là <strong>{formatCurrency(balance)}</strong>
                </p>
            </div>

            <div className="wallet-deposit-card">
                {/* Payment Method Selector */}
                <div className="payment-method-selector">
                    <button
                        type="button"
                        className={`payment-method-option ${paymentMethod === PAYMENT_METHODS.VNPAY ? "active" : ""}`}
                        data-method={PAYMENT_METHODS.VNPAY}
                        onClick={() => {
                            setPaymentMethod(PAYMENT_METHODS.VNPAY);
                            setError("");
                        }}
                    >
                        <div className="payment-method-option-icon vnpay">
                            <span>VNPAY</span>
                        </div>
                        <span>VNPay</span>
                    </button>
                    <button
                        type="button"
                        className={`payment-method-option ${paymentMethod === PAYMENT_METHODS.MOMO ? "active" : ""}`}
                        data-method={PAYMENT_METHODS.MOMO}
                        onClick={() => {
                            setPaymentMethod(PAYMENT_METHODS.MOMO);
                            setError("");
                        }}
                    >
                        <div className="payment-method-option-icon momo">
                            <span>MoMo</span>
                        </div>
                        <span>MoMo</span>
                    </button>
                </div>

                {/* Payment Method Section */}
                <div className={`payment-method-section ${paymentMethod === PAYMENT_METHODS.MOMO ? "momo" : "vnpay"}`}>
                    <div className="payment-method-header">
                        <div className={`payment-icon-wrapper ${paymentMethod === PAYMENT_METHODS.MOMO ? "momo" : "vnpay"}`}>
                            <span className="payment-text">
                                {paymentMethod === PAYMENT_METHODS.MOMO ? "MoMo" : "VNPAY"}
                            </span>
                        </div>
                        <div className="payment-method-info">
                            <div className="payment-method-title">
                                Nạp tiền qua {paymentMethod === PAYMENT_METHODS.MOMO ? "MoMo" : "VNPAY"}
                            </div>
                            <div className="no-fee-badge">Miễn phí giao dịch</div>
                        </div>
                    </div>
                </div>

                <form className="wallet-deposit-form" onSubmit={handleSubmit}>
                    {/* Amount Input */}
                    <div className="form-group">
                        <label className="form-label">Nhập số tiền nạp</label>
                        <div className="amount-input-wrapper">
                            <span className="currency-symbol">₫</span>
                            <input
                                type="text"
                                value={displayAmount}
                                onChange={(e) => {
                                    const numericValue = formatInputAmount(e.target.value);
                                    setAmount(numericValue);
                                    setError("");
                                }}
                                className="amount-input"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Quick Amount Buttons */}
                    <div className="quick-amount-section">
                        {quickAmounts.map((quickAmount) => (
                            <button
                                key={quickAmount}
                                type="button"
                                className={`quick-amount-btn ${amount === quickAmount.toString() || parseInt(amount) === quickAmount ? "active" : ""}`}
                                onClick={() => handleQuickAmount(quickAmount)}
                            >
                                {formatCurrency(quickAmount)}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !amount || parseInt(amount) < 1000}
                        className={`continue-button ${paymentMethod === PAYMENT_METHODS.MOMO ? "momo" : "vnpay"}`}
                    >
                        {loading ? "Đang chuyển hướng..." : "Tiếp tục"}
                    </button>
                </form>

                {/* Security Info */}
                <div className="security-info">
                    <Lock size={16} />
                    <span>Kết nối SSL bảo mật</span>
                </div>
            </div>
        </div>
    );
}
