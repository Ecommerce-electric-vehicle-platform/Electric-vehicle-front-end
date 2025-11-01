import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import vnpayApi from "../../api/vnpayApi";

export default function VnPayReturn() {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState({ loading: true, ok: false, message: "" });

    const queryString = useMemo(() => {
        const qs = location.search?.startsWith("?") ? location.search.substring(1) : location.search;
        return qs || "";
    }, [location.search]);

    const responseCode = useMemo(() => {
        const params = new URLSearchParams(queryString);
        return params.get("vnp_ResponseCode");
    }, [queryString]);

    const txnInfo = useMemo(() => {
        const params = new URLSearchParams(queryString);
        const amountStr = params.get("vnp_Amount") || "";
        const amountNum = Number(amountStr);
        // VNPay thường trả vnp_Amount nhân 100, xử lý linh hoạt
        const normalizedAmount = amountNum >= 100 && amountNum % 100 === 0 ? amountNum / 100 : amountNum;
        const formattedAmount = isNaN(normalizedAmount)
            ? "—"
            : new Intl.NumberFormat("vi-VN").format(normalizedAmount) + " ₫";

        return {
            amount: formattedAmount,
            bankCode: params.get("vnp_BankCode") || "—",
            cardType: params.get("vnp_CardType") || "—",
            txnRef: params.get("vnp_TxnRef") || "—",
            orderInfo: params.get("vnp_OrderInfo") || "Nạp ví",
            transNo: params.get("vnp_TransactionNo") || "—",
        };
    }, [queryString]);

    useEffect(() => {
        let isMounted = true;
        async function verify() {
            // Chỉ gọi về BE khi VNPay trả mã thành công 00
            if (responseCode !== "00") {
                setStatus({ loading: false, ok: false, message: "Giao dịch không thành công" });
                return;
            }
            try {
                const res = await vnpayApi.handleReturn(queryString);
                let ok = false;
                if (res?.data?.success === true) ok = true;
                else if (res?.data?.status === "SUCCESS") ok = true;
                else if (res?.data?.data === "00" || res?.data?.code === "00") ok = true; // một số BE trả mã ở data/code
                const msg = res?.data?.message || (ok ? "Giao dịch thành công" : "Giao dịch thất bại");
                if (!isMounted) return;
                setStatus({ loading: false, ok: !!ok, message: msg });

                // 🔄 Dispatch event để refresh wallet data và transactions
                if (ok) {
                    console.log("🔄 Dispatching walletUpdated event after successful payment");
                    window.dispatchEvent(new CustomEvent("walletUpdated"));
                }
            } catch (err) {
                if (!isMounted) return;
                setStatus({ loading: false, ok: false, message: err?.message || "Xác minh giao dịch thất bại" });
            }
        }
        verify();
        return () => {
            isMounted = false;
        };
    }, [queryString, responseCode]);

    const gradientBg = {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 40%, #F8FAFC 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    };

    const card = {
        width: "100%",
        maxWidth: 720,
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(2,6,23,0.08)",
        padding: 24,
    };

    const iconWrap = (ok) => ({
        width: 64,
        height: 64,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: ok ? "#DEF7EC" : "#FDE2E1",
        color: ok ? "#03543F" : "#9B1C1C",
        margin: "0 auto",
    });

    const section = {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
        marginTop: 16,
    };

    const detailItem = {
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 12,
    };

    return (
        <div style={gradientBg}>
            <div style={card}>
                <div style={{ textAlign: "center" }}>
                    <div style={iconWrap(status.ok)}>
                        {status.ok ? (
                            // Check icon
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 7L9 18L4 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            // X icon
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                    <h2 style={{ marginTop: 12, marginBottom: 4 }}>{status.ok ? "Thanh toán thành công" : "Thanh toán thất bại"}</h2>
                    <div style={{ color: "#6B7280" }}>{status.message || (status.ok ? "Giao dịch đã được ghi nhận." : "Vui lòng thử lại hoặc chọn phương thức khác.")}</div>
                </div>

                {/* Details */}
                <div style={section}>
                    <div style={detailItem}>
                        <div style={{ color: "#6B7280", marginBottom: 4 }}>Số tiền</div>
                        <div style={{ fontWeight: 600 }}>{txnInfo.amount}</div>
                    </div>
                    <div style={detailItem}>
                        <div style={{ color: "#6B7280", marginBottom: 4 }}>Ngân hàng</div>
                        <div>{txnInfo.bankCode}</div>
                    </div>
                    <div style={detailItem}>
                        <div style={{ color: "#6B7280", marginBottom: 4 }}>Mã giao dịch</div>
                        <div>{txnInfo.transNo}</div>
                    </div>
                    <div style={detailItem}>
                        <div style={{ color: "#6B7280", marginBottom: 4 }}>Mã tham chiếu</div>
                        <div>{txnInfo.txnRef}</div>
                    </div>
                </div>

                {/* Actions */}
                <div style={{ marginTop: 20, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                        onClick={() => navigate("/profile?tab=wallet")}
                        style={{
                            padding: "10px 16px",
                            borderRadius: 10,
                            border: "none",
                            background: "#111827",
                            color: "#fff",
                            cursor: "pointer",
                        }}
                    >
                        Về trang cá nhân
                    </button>
                    {!status.ok ? (
                        <button
                            onClick={() => navigate("/wallet/deposit")}
                            style={{
                                padding: "10px 16px",
                                borderRadius: 10,
                                border: "1px solid #E5E7EB",
                                background: "#fff",
                                color: "#111827",
                                cursor: "pointer",
                            }}
                        >
                            Thử lại nạp tiền
                        </button>
                    ) : (
                        <button
                            onClick={() => navigate("/wallet/deposit")}
                            style={{
                                padding: "10px 16px",
                                borderRadius: 10,
                                border: "1px solid #E5E7EB",
                                background: "#fff",
                                color: "#111827",
                                cursor: "pointer",
                            }}
                        >
                            Nạp thêm
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}


