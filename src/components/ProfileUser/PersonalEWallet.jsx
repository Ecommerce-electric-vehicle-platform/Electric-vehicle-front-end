import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import profileApi from "../../api/profileApi";
import {
    Plus,
    ArrowUpRight,
    ArrowDownToLine,
    Wallet,
} from "lucide-react";
import "./PersonalEWallet.css";

export default function PersonalEWallet() {
    const navigate = useNavigate();
    const [walletData, setWalletData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Mock recent transactions - TODO: Replace with actual API
    const [recentTransactions] = useState([
        {
            id: "TXN001",
            type: "deposit",
            description: "Bán pin Model X Battery",
            date: "25 tháng 10",
            amount: 350000,
        },
        {
            id: "TXN002",
            type: "withdrawal",
            description: "Rút tiền về ngân hàng",
            date: "24 tháng 10",
            amount: -200000,
        },
        {
            id: "TXN003",
            type: "deposit",
            description: "Nạp tiền từ ngân hàng",
            date: "22 tháng 10",
            amount: 500000,
        },
    ]);

    // Format số tiền
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "—";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };


    // Lấy thông tin ví
    useEffect(() => {
        const fetchWalletData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await profileApi.getWallet();

                console.log("Wallet API Response:", response);

                // Parse balance từ nhiều cấu trúc có thể
                let balance = 0;
                if (response?.data?.data?.balance !== undefined) {
                    balance = response.data.data.balance;
                } else if (response?.data?.balance !== undefined) {
                    balance = response.data.balance;
                } else if (response?.balance !== undefined) {
                    balance = response.balance;
                }

                setWalletData({
                    ...(response?.data?.data || response?.data || {}),
                    balance: Number(balance) || 0
                });

                console.log("Parsed wallet data:", { balance });
            } catch (err) {
                console.error("Lỗi khi tải thông tin ví:", err);
                setError(
                    err.response?.data?.message ||
                    "Có lỗi xảy ra khi tải thông tin ví"
                );
                // Set default balance = 0 nếu có lỗi
                setWalletData({ balance: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchWalletData();

        // 🔄 Lắng nghe event refresh wallet data
        const handleWalletUpdate = () => {
            console.log("🔄 Refreshing wallet data...");
            fetchWalletData();
        };

        window.addEventListener("walletUpdated", handleWalletUpdate);

        return () => {
            window.removeEventListener("walletUpdated", handleWalletUpdate);
        };
    }, []);

    return (
        <div className="ewallet-container">
            <h2 className="ewallet-title">Ví điện tử của tôi</h2>

            {/* Available Balance - Always show */}
            <div className="balance-section">
                <div className="balance-title">Số dư</div>
                <div className="balance-label">Số dư khả dụng</div>
                <div className="balance-amount">
                    {loading ? (
                        <span className="balance-loading-text">Đang tải...</span>
                    ) : (
                        <span className="balance-value">
                            {formatCurrency(walletData?.balance ?? 0)}
                        </span>
                    )}
                </div>
            </div>

            {error && !loading && (
                <div className="ewallet-error" style={{ marginBottom: "24px" }}>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>
                        Thử lại
                    </button>
                </div>
            )}

            {loading && (
                <div className="ewallet-loading" style={{ marginBottom: "24px" }}>
                    <div className="loading-spinner"></div>
                    <p>Đang tải thông tin ví...</p>
                </div>
            )}

            {!loading && !error && (
                <>

                    {/* Action Buttons */}
                    <div className="action-buttons-row">
                        <button
                            className="action-btn deposit-btn"
                            onClick={() => navigate("/wallet/deposit")}
                        >
                            <Plus size={18} />
                            <span>Nạp tiền</span>
                        </button>
                        <button
                            className="action-btn send-btn"
                            onClick={() => {
                                alert("Tính năng gửi tiền sẽ sớm được cập nhật!");
                            }}
                        >
                            <ArrowUpRight size={18} />
                            <span>Gửi tiền</span>
                        </button>
                    </div>

                    {/* Recent Activity */}
                    <div className="recent-activity-section">
                        <h3 className="recent-activity-title">Hoạt động gần đây</h3>
                        <div className="transactions-list">
                            {recentTransactions.map((txn) => (
                                <div key={txn.id} className="transaction-item">
                                    <div className={`transaction-icon-wrapper ${txn.type === "deposit" ? "deposit-icon" : "withdrawal-icon"}`}>
                                        {txn.type === "deposit" ? (
                                            <ArrowDownToLine
                                                size={18}
                                                className="transaction-icon"
                                            />
                                        ) : (
                                            <ArrowUpRight
                                                size={18}
                                                className="transaction-icon"
                                            />
                                        )}
                                    </div>
                                    <div className="transaction-content">
                                        <div className="transaction-description">
                                            {txn.description}
                                        </div>
                                        <div className="transaction-date">{txn.date}</div>
                                    </div>
                                    <div
                                        className={`transaction-amount ${txn.amount > 0 ? "positive" : "negative"
                                            }`}
                                    >
                                        {txn.amount > 0 ? "+" : ""}
                                        {formatCurrency(txn.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* View All Link */}
                    <div className="view-all-section">
                        <button
                            className="view-all-link"
                            onClick={() => navigate("/wallet")}
                        >
                            Xem tất cả giao dịch
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
