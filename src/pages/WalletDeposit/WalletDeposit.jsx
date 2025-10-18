import { useState } from "react";
import vnpayApi from "../../api/vnpayApi";

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
        <div style={{ maxWidth: 480, margin: "40px auto" }}>
            <h2>Nạp tiền vào ví</h2>
            <form onSubmit={handleSubmit}>
                <label style={{ display: "block", marginBottom: 8 }}>
                    Số tiền (VND)
                </label>
                <input
                    type="number"
                    min={1000}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    style={{
                        width: "100%",
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                    }}
                />

                {error && (
                    <div style={{ marginTop: 8, color: "#d33" }}>{error}</div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        marginTop: 16,
                        width: "100%",
                        padding: 12,
                        borderRadius: 8,
                        border: "none",
                        background: "#2a9d8f",
                        color: "#fff",
                        cursor: "pointer",
                    }}
                >
                    {loading ? "Đang chuyển đến VNPay..." : "Thanh toán qua VNPay"}
                </button>
            </form>
        </div>
    );
}
