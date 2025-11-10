import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import vnpayApi from "../../api/vnpayApi";
import { useWalletBalance } from "../../hooks/useWalletBalance";
import "./WalletWithdraw.css";

export default function WalletWithdraw() {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const { balance, formatCurrency } = useWalletBalance();

    const quickAmounts = [500000, 1000000, 2000000, 5000000];

    const handleQuickAmount = (quickAmount) => {
        setAmount(quickAmount.toString());
        setError("");
        setSuccess("");
    };

    const formatInputAmount = (value) => {
        const numericValue = value.replace(/\D/g, "");
        return numericValue;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!amount || Number(amount) <= 0) {
            setError("Số tiền phải lớn hơn 0");
            return;
        }

        const token = localStorage.getItem("accessToken");
        if (!token) {
            setError("Vui lòng đăng nhập để rút tiền.");
            return;
        }

        try {
            setLoading(true);
            const res = await vnpayApi.withdraw(Number(amount));
            const url =
                res?.data?.data?.url_payment ||
                res?.data?.paymentUrl ||
                res?.data?.url;

            if (url && typeof url === "string") {
                window.location.href = url;
                return;
            }

            setSuccess("Yêu cầu rút tiền đã được gửi. Bạn có thể xem chi tiết tại Ví của tôi.");
            window.dispatchEvent(new Event("walletUpdated"));
        } catch (err) {
            console.error("❌ Lỗi rút tiền:", err);
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Rút tiền thất bại. Vui lòng thử lại.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const goToWalletDashboard = () => {
        navigate("/wallet");
    };

    const goToPersonalWallet = () => {
        navigate("/profile?tab=wallet");
    };

    const displayAmount = amount ? parseInt(amount, 10).toLocaleString("vi-VN") : "0";

    return (
        <div className="wallet-deposit-page wallet-withdraw-page">
            <div className="wallet-deposit-header">
                <h1 className="page-title">Rút tiền từ ví</h1>
                <p className="current-balance">
                    Số dư hiện tại của bạn là <strong>{formatCurrency(balance)}</strong>
                </p>
            </div>

            <div className="wallet-deposit-card wallet-withdraw-card">
                <div className="payment-method-section">
                    <div className="payment-method-header">
                        <div className="vnpay-icon-wrapper">
                            <span className="vnpay-text">VNPAY</span>
                        </div>
                        <div className="payment-method-info">
                            <div className="payment-method-title">Rút tiền qua VNPAY</div>
                            <div className="no-fee-badge">Miễn phí giao dịch</div>
                        </div>
                    </div>
                </div>

                <form className="wallet-deposit-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Nhập số tiền rút</label>
                        <div className="amount-input-wrapper">
                            <span className="currency-symbol">₫</span>
                            <input
                                type="text"
                                value={displayAmount}
                                onChange={(e) => {
                                    const numericValue = formatInputAmount(e.target.value);
                                    setAmount(numericValue);
                                    setError("");
                                    setSuccess("");
                                }}
                                className="amount-input"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    <div className="quick-amount-section">
                        {quickAmounts.map((quickAmount) => (
                            <button
                                key={quickAmount}
                                type="button"
                                className={`quick-amount-btn ${amount === quickAmount.toString() || parseInt(amount, 10) === quickAmount ? "active" : ""}`}
                                onClick={() => handleQuickAmount(quickAmount)}
                            >
                                {formatCurrency(quickAmount)}
                            </button>
                        ))}
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    {success && (
                        <>
                            <div className="success-message">{success}</div>
                            <div className="success-actions">
                                <button
                                    type="button"
                                    className="success-btn secondary"
                                    onClick={goToWalletDashboard}
                                >
                                    Về trang Ví của tôi
                                </button>
                                <button
                                    type="button"
                                    className="success-btn primary"
                                    onClick={goToPersonalWallet}
                                >
                                    Xem Ví điện tử cá nhân
                                </button>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !amount || parseInt(amount, 10) < 1000 || !!success}
                        className="continue-button withdraw-continue-button"
                    >
                        {loading ? "Đang xử lý..." : "Xác nhận rút"}
                    </button>
                </form>

                <div className="security-info">
                    <Lock size={16} />
                    <span>Kết nối SSL bảo mật</span>
                </div>
            </div>
        </div>
    );
}

