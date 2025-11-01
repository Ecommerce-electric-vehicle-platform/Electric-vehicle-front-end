import { useState } from "react";
import { Lock } from "lucide-react";
import vnpayApi from "../../api/vnpayApi";
import { useWalletBalance } from "../../hooks/useWalletBalance";
import "./WalletDeposit.css";

export default function WalletDeposit() {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { balance, formatCurrency } = useWalletBalance();

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

            // 📡 Gọi API tạo URL thanh toán
            const res = await vnpayApi.createPayment(Number(amount));
            console.log("VNPay response:", res.data);

            // 🔑 Lấy URL trả về đúng key `url_payment`
            const payUrl =
                res?.data?.data?.url_payment || // ✅ đúng key từ BE
                res?.data?.paymentUrl ||
                res?.data?.data?.paymentUrl ||
                res?.data?.url;

            if (payUrl && typeof payUrl === "string") {
                console.log("🔗 Redirecting to:", payUrl);
                window.location.href = payUrl;
            } else {
                setError("Không nhận được đường dẫn thanh toán");
            }
        } catch (err) {
            console.error("❌ Lỗi tạo thanh toán:", err);
            setError(err?.message || "Tạo yêu cầu thanh toán thất bại");
        } finally {
            setLoading(false);
        }
    };

    // Format amount for display
    const displayAmount = amount ? parseInt(amount).toLocaleString("vi-VN") : "0";

    return (
        <div className="wallet-deposit-page">
            <div className="wallet-deposit-header">
                <h1 className="page-title">Nạp tiền vào ví</h1>
                <p className="current-balance">
                    Số dư hiện tại của bạn là <strong>{formatCurrency(balance)}</strong>
                </p>
            </div>

            <div className="wallet-deposit-card">
                {/* Payment Method Section */}
                <div className="payment-method-section">
                    <div className="payment-method-header">
                        <div className="vnpay-icon-wrapper">
                            <span className="vnpay-text">VNPAY</span>
                        </div>
                        <div className="payment-method-info">
                            <div className="payment-method-title">Nạp tiền qua VNPAY</div>
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
                        <div className="error-message">{error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !amount || parseInt(amount) < 1000}
                        className="continue-button"
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
