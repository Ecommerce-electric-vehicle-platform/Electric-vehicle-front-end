import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import momoApi from "../../api/momoApi";
import "./MoMoReturn.css";

export default function MoMoReturn() {
    const location = useLocation();
    const navigate = useNavigate();
    const [status, setStatus] = useState({ loading: true, ok: false, message: "" });

    const queryString = useMemo(() => {
        const qs = location.search?.startsWith("?") ? location.search.substring(1) : location.search;
        return qs || "";
    }, [location.search]);

    const resultCode = useMemo(() => {
        const params = new URLSearchParams(queryString);
        return params.get("resultCode");
    }, [queryString]);

    const txnInfo = useMemo(() => {
        const params = new URLSearchParams(queryString);
        const amountStr = params.get("amount") || "";
        const amountNum = Number(amountStr);
        const formattedAmount = isNaN(amountNum)
            ? "—"
            : new Intl.NumberFormat("vi-VN").format(amountNum) + " ₫";

        return {
            amount: formattedAmount,
            orderId: params.get("orderId") || "—",
            transId: params.get("transId") || "—",
            message: params.get("message") || "—",
            payType: params.get("payType") || "—",
        };
    }, [queryString]);

    useEffect(() => {
        let isMounted = true;
        async function verify() {
            // MoMo trả resultCode = "0" khi thành công
            if (resultCode !== "0") {
                setStatus({ 
                    loading: false, 
                    ok: false, 
                    message: txnInfo.message || "Giao dịch không thành công" 
                });
                return;
            }
            try {
                const res = await momoApi.handleReturn(queryString);
                let ok = false;
                if (res?.data?.success === true) ok = true;
                else if (res?.data?.status === "SUCCESS") ok = true;
                else if (resultCode === "0") ok = true;
                
                const msg = res?.data?.message || (ok ? "Giao dịch thành công" : "Giao dịch thất bại");
                if (!isMounted) return;
                setStatus({ loading: false, ok: !!ok, message: msg });

                // 🔄 Dispatch event để refresh wallet data và transactions
                if (ok) {
                    console.log("🔄 Dispatching walletUpdated event after successful MoMo payment");
                    window.dispatchEvent(new CustomEvent("walletUpdated"));
                }
            } catch (err) {
                if (!isMounted) return;
                setStatus({ 
                    loading: false, 
                    ok: false, 
                    message: err?.response?.data?.message || err?.message || "Xác minh giao dịch thất bại" 
                });
            }
        }
        verify();
        return () => {
            isMounted = false;
        };
    }, [queryString, resultCode, txnInfo.message]);

    return (
        <div className="momo-return-page">
            <div className="momo-return-card">
                {status.loading ? (
                    <div className="momo-return-loading">
                        <div className="momo-return-loader">
                            <div className="momo-return-loader-circle"></div>
                            <div className="momo-return-loader-circle"></div>
                            <div className="momo-return-loader-circle"></div>
                        </div>
                        <div className="momo-return-loading-text">Đang xác minh giao dịch...</div>
                    </div>
                ) : (
                    <>
                        <div className="momo-return-header">
                            <div className={`momo-return-icon ${status.ok ? "success" : "error"}`}>
                                {status.ok ? (
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path 
                                            d="M20 7L9 18L4 13" 
                                            stroke="currentColor" 
                                            strokeWidth="2.5" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                        />
                                    </svg>
                                ) : (
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path 
                                            d="M6 6L18 18M6 18L18 6" 
                                            stroke="currentColor" 
                                            strokeWidth="2.5" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                        />
                                    </svg>
                                )}
                            </div>
                            <h2 className="momo-return-title">
                                {status.ok ? "Thanh toán thành công" : "Thanh toán thất bại"}
                            </h2>
                            <p className="momo-return-message">
                                {status.message || (status.ok ? "Giao dịch đã được ghi nhận." : "Vui lòng thử lại hoặc chọn phương thức khác.")}
                            </p>
                        </div>

                        {/* Transaction Details */}
                        <div className="momo-return-details">
                            <div className="momo-return-detail-item">
                                <div className="momo-return-detail-label">Số tiền</div>
                                <div className="momo-return-detail-value">{txnInfo.amount}</div>
                            </div>
                            <div className="momo-return-detail-item">
                                <div className="momo-return-detail-label">Mã đơn hàng</div>
                                <div className="momo-return-detail-value">{txnInfo.orderId}</div>
                            </div>
                            <div className="momo-return-detail-item">
                                <div className="momo-return-detail-label">Mã giao dịch</div>
                                <div className="momo-return-detail-value">{txnInfo.transId}</div>
                            </div>
                            <div className="momo-return-detail-item">
                                <div className="momo-return-detail-label">Phương thức</div>
                                <div className="momo-return-detail-value">MoMo Wallet</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="momo-return-actions">
                            {/* Nút quay lại đặt hàng nếu có returnUrl và thanh toán thành công */}
                            {status.ok && (() => {
                                const returnUrl = localStorage.getItem('walletDepositReturnUrl');
                                const productState = localStorage.getItem('walletDepositProductState');
                                const orderDataState = localStorage.getItem('walletDepositOrderData');
                                const addressStatesState = localStorage.getItem('walletDepositAddressStates');
                                if (returnUrl) {
                                    return (
                                        <button
                                            onClick={() => {
                                                // Khôi phục tất cả state nếu có
                                                let state = {};
                                                if (productState) {
                                                    try {
                                                        state.product = JSON.parse(productState);
                                                    } catch (e) {
                                                        console.error('Error parsing product state:', e);
                                                    }
                                                }
                                                if (orderDataState) {
                                                    try {
                                                        state.orderData = JSON.parse(orderDataState);
                                                    } catch (e) {
                                                        console.error('Error parsing order data state:', e);
                                                    }
                                                }
                                                if (addressStatesState) {
                                                    try {
                                                        state.addressStates = JSON.parse(addressStatesState);
                                                    } catch (e) {
                                                        console.error('Error parsing address states:', e);
                                                    }
                                                }
                                                // Xóa tất cả dữ liệu sau khi sử dụng
                                                localStorage.removeItem('walletDepositReturnUrl');
                                                localStorage.removeItem('walletDepositProductState');
                                                localStorage.removeItem('walletDepositOrderData');
                                                localStorage.removeItem('walletDepositAddressStates');
                                                navigate(returnUrl, { state });
                                            }}
                                            className="momo-return-btn primary"
                                            style={{ background: "#10B981" }}
                                        >
                                            Quay lại đặt hàng
                                        </button>
                                    );
                                }
                                return null;
                            })()}
                            <button
                                onClick={() => {
                                    // Xóa tất cả dữ liệu khi người dùng chọn về trang cá nhân
                                    localStorage.removeItem('walletDepositReturnUrl');
                                    localStorage.removeItem('walletDepositProductState');
                                    localStorage.removeItem('walletDepositOrderData');
                                    localStorage.removeItem('walletDepositAddressStates');
                                    navigate("/profile?tab=wallet");
                                }}
                                className="momo-return-btn primary"
                            >
                                Về trang cá nhân
                            </button>
                            {!status.ok ? (
                                <button
                                    onClick={() => navigate("/wallet/deposit")}
                                    className="momo-return-btn secondary"
                                >
                                    Thử lại nạp tiền
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        // Xóa tất cả dữ liệu khi người dùng chọn nạp thêm
                                        localStorage.removeItem('walletDepositReturnUrl');
                                        localStorage.removeItem('walletDepositProductState');
                                        localStorage.removeItem('walletDepositOrderData');
                                        localStorage.removeItem('walletDepositAddressStates');
                                        navigate("/wallet/deposit");
                                    }}
                                    className="momo-return-btn secondary"
                                >
                                    Nạp thêm
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

