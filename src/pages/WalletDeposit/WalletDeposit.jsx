import { useState } from "react";
import vnpayApi from "../../api/vnpayApi";
import "./WalletDeposit.css";

export default function WalletDeposit() {
    const [amount, setAmount] = useState(100000);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

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

    return (
        <div className="wallet-deposit-container">
            <h2 className="wallet-deposit-title">Nạp tiền vào ví</h2>
            <form className="wallet-deposit-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">
                        Số tiền nạp (VND)
                    </label>
                    <input
                        type="number"
                        min={1000}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="form-input"
                        placeholder="Nhập số tiền cần nạp"
                    />
                </div>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="submit-button"
                >
                    {loading ? "Đang chuyển đến VNPay..." : "Thanh toán qua VNPay"}
                </button>
            </form>
        </div>
    );
}
