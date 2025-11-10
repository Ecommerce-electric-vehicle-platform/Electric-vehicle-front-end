import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import profileApi from "../../api/profileApi";
import {
    Plus,
    ArrowUpRight,
    ArrowDownToLine,
    Wallet,
} from "lucide-react";
import "./PersonalEWallet.css";

// Format date cho PersonalEWallet (ví dụ: "25 tháng 10")
const formatDateForPersonalEWallet = (timestamp) => {
    if (!timestamp) {
        return "Chưa có";
    }

    try {
        let date;
        if (typeof timestamp === 'number') {
            date = new Date(timestamp);
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                const trimmed = timestamp.trim();
                date = new Date(trimmed);
            }
        } else {
            date = new Date(timestamp);
        }

        if (isNaN(date.getTime())) {
            return "Chưa có";
        }

        const day = date.getDate();
        const monthNames = [
            "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
            "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"
        ];
        const month = monthNames[date.getMonth()];

        return `${day} ${month}`;
    } catch (err) {
        console.warn('Error formatting date:', err);
        return "Chưa có";
    }
};

// Map transaction từ API sang format cho PersonalEWallet
const mapTransactionFromAPI = (apiTransaction) => {
    if (!apiTransaction) return null;

    // Map transaction type
    const mapTransactionTypeForIcon = (type) => {
        if (!type) return "deposit";
        const upperType = type?.toUpperCase();
        // DEPOSIT, CREDIT -> deposit (hiển thị icon mũi tên xuống, màu xanh)
        if (upperType === "DEPOSIT" || upperType === "CREDIT") {
            return "deposit";
        }
        // WITHDRAW, DEBIT -> withdrawal (hiển thị icon mũi tên lên, màu đỏ)
        if (upperType === "WITHDRAW" || upperType === "DEBIT" || upperType === "PAYMENT") {
            return "withdrawal";
        }
        // Mặc định là deposit
        return "deposit";
    };

    // Dịch description sang tiếng Việt
    const translateDescription = (description) => {
        if (!description) return "Giao dịch";
        const descLower = description.toLowerCase().trim();
        const translations = {
            "deposit money into user's wallet": "Nạp tiền vào ví người dùng",
            "deposit money into wallet": "Nạp tiền vào ví",
            "deposit into wallet": "Nạp tiền vào ví",
            "deposit": "Nạp tiền",
            "withdraw from wallet": "Rút tiền từ ví",
            "withdraw": "Rút tiền",
            "payment": "Thanh toán",
            "transfer": "Chuyển khoản",
            "transaction": "Giao dịch",
            "refund": "Hoàn tiền",
            "top up": "Nạp tiền",
            "recharge": "Nạp tiền",
            "payment for order": "Thanh toán đơn hàng",
            "order payment": "Thanh toán đơn hàng",
            "payment order": "Thanh toán đơn hàng",
            "wallet deposit": "Nạp tiền vào ví",
            "wallet withdrawal": "Rút tiền từ ví",
            "wallet transfer": "Chuyển khoản ví"
        };
        for (const [key, value] of Object.entries(translations)) {
            if (descLower.includes(key)) {
                return value;
            }
        }
        return description;
    };

    const transactionId = apiTransaction.transactionId || apiTransaction.id || apiTransaction.transaction_id || `TXN${Date.now()}`;
    const transactionType = apiTransaction.transactionType || apiTransaction.type || apiTransaction.transaction_type;
    const rawDescription = apiTransaction.description || apiTransaction.note || apiTransaction.reason || apiTransaction.detail || "Giao dịch";
    const description = translateDescription(rawDescription);
    const amount = Number(apiTransaction.amount) || 0;

    // Tìm timestamp
    let timestamp =
        apiTransaction.timestamp ||
        apiTransaction.createdAt ||
        apiTransaction.transactionDate ||
        apiTransaction.created_at ||
        apiTransaction.date ||
        apiTransaction.dateTime ||
        apiTransaction.date_time ||
        apiTransaction.createdDate ||
        apiTransaction.created_date ||
        apiTransaction.transactionDateTime ||
        apiTransaction.transaction_date_time ||
        apiTransaction.time ||
        null;

    // Tự động tìm timestamp nếu không tìm thấy
    if (!timestamp) {
        for (const [key, value] of Object.entries(apiTransaction)) {
            if (!value) continue;
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('date') || lowerKey.includes('time') || lowerKey.includes('created') || lowerKey.includes('timestamp')) {
                const testDate = new Date(value);
                if (!isNaN(testDate.getTime())) {
                    timestamp = value;
                    break;
                }
            }
        }
    }

    // Convert timestamp to Date object để có thể sắp xếp
    let timestampDate = null;
    if (timestamp) {
        try {
            timestampDate = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
            if (isNaN(timestampDate.getTime())) {
                timestampDate = null;
            }
        } catch {
            timestampDate = null;
        }
    }

    return {
        id: transactionId,
        type: mapTransactionTypeForIcon(transactionType),
        description: description,
        date: formatDateForPersonalEWallet(timestamp),
        amount: amount,
        timestamp: timestampDate, // Lưu timestamp để sắp xếp
    };
};

export default function PersonalEWallet() {
    const navigate = useNavigate();
    const [walletData, setWalletData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Recent transactions from API
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    // Format số tiền
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "—";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };


    // Fetch recent transactions
    const fetchRecentTransactions = useCallback(async () => {
        try {
            setLoadingTransactions(true);
            console.log("🔄 PersonalEWallet: Fetching recent transactions...");
            // Thử với page 0 trước (0-based pagination), nếu không có thì thử page 1
            let response = await profileApi.getTransactionHistory(0, 5); // Lấy 5 transactions gần nhất với page 0

            // Log full response structure for debugging (tương tự WalletDashboard)
            console.log("✅ PersonalEWallet: Full API Response Object:", response);
            console.log("✅ PersonalEWallet: Response.data:", response?.data);
            console.log("✅ PersonalEWallet: Response.data.data:", response?.data?.data);
            console.log("✅ PersonalEWallet: Response.data.data?.content:", response?.data?.data?.content);
            console.log("✅ PersonalEWallet: Response.data.data?.totalElements:", response?.data?.data?.totalElements);

            // Parse response structure - handle multiple possible structures (tương tự WalletDashboard)
            let responseData = null;
            let content = [];

            // Try different response structures
            if (response?.data?.data) {
                // Standard structure: { success: true, data: { content: [], ... } }
                responseData = response.data.data;
                content = responseData.content || [];

                // Check if content is actually empty or if it's in a different field
                if (Array.isArray(content) && content.length === 0) {
                    console.warn("⚠️ PersonalEWallet: Content array is empty, checking alternative fields...");
                    // Check for alternative field names
                    const possibleFields = ['transactions', 'items', 'results', 'data', 'list'];
                    for (const field of possibleFields) {
                        if (Array.isArray(responseData[field]) && responseData[field].length > 0) {
                            console.log(`✅ PersonalEWallet: Found transactions in field: ${field}`);
                            content = responseData[field];
                            break;
                        }
                    }
                }
            } else if (response?.data?.content) {
                // Alternative: { success: true, content: [] }
                content = response.data.content || [];
                responseData = response.data;
            } else if (Array.isArray(response?.data)) {
                // Direct array response
                content = response.data;
                responseData = { content: content };
            }

            console.log("📦 PersonalEWallet: Response parsing result:", {
                hasResponseData: !!responseData,
                contentLength: content.length,
                contentIsArray: Array.isArray(content),
                responseDataKeys: responseData ? Object.keys(responseData) : [],
                totalElements: responseData?.totalElements,
                totalPages: responseData?.totalPages,
            });

            if (content.length > 0) {
                console.log("📦 PersonalEWallet: First transaction sample:", content[0]);
                console.log("📦 PersonalEWallet: First transaction keys:", Object.keys(content[0]));
            } else {
                console.warn("⚠️ PersonalEWallet: Content array is empty!");
                console.warn("⚠️ PersonalEWallet: But totalElements:", responseData?.totalElements);
                console.warn("⚠️ PersonalEWallet: numberOfElements:", responseData?.numberOfElements);
                console.warn("⚠️ PersonalEWallet: empty:", responseData?.empty);
                console.warn("⚠️ PersonalEWallet: Full responseData:", responseData);

                // Log toàn bộ keys của responseData để tìm field chứa transactions
                if (responseData) {
                    console.log("📋 PersonalEWallet: All responseData keys:", Object.keys(responseData));
                    console.log("📋 PersonalEWallet: Full responseData stringified:", JSON.stringify(responseData, null, 2));

                    // Kiểm tra từng field xem có phải là array không
                    Object.entries(responseData).forEach(([key, value]) => {
                        if (Array.isArray(value) && value.length > 0) {
                            console.log(`✅ PersonalEWallet: Found array field '${key}' with ${value.length} items:`, value);
                        }
                    });
                }

                // WORKAROUND: Nếu totalElements > 0 nhưng content rỗng
                // Đã thử page 0, bây giờ thử page 1 (1-based pagination)
                if (responseData?.totalElements > 0 && content.length === 0) {
                    console.log("🔧 PersonalEWallet: Attempting workaround: Trying page 1 (1-based pagination)...");
                    try {
                        const retryResponse = await profileApi.getTransactionHistory(1, 5);
                        const retryData = retryResponse?.data?.data;
                        if (retryData?.content && retryData.content.length > 0) {
                            console.log("✅ PersonalEWallet: Workaround succeeded! Found content with page 1");
                            content = retryData.content;
                            responseData = retryData;
                        } else {
                            console.warn("⚠️ PersonalEWallet: Workaround with page 1 also returned empty content");
                            // Log lại để xem có gì khác không
                            console.warn("⚠️ PersonalEWallet: Retry responseData keys:", retryData ? Object.keys(retryData) : []);
                        }
                    } catch (retryErr) {
                        console.error("❌ PersonalEWallet: Error during workaround retry:", retryErr);
                    }
                }
            }

            console.log("📦 PersonalEWallet: Received transactions:", content.length);

            // Map transactions và sắp xếp theo thời gian (mới nhất lên đầu)
            const mapped = content
                .map(mapTransactionFromAPI)
                .filter(tx => tx !== null);

            console.log("📦 PersonalEWallet: Mapped transactions:", mapped.length);
            if (mapped.length > 0) {
                console.log("📦 PersonalEWallet: First mapped transaction:", mapped[0]);
            }

            // Sắp xếp theo thời gian nếu có (mới nhất lên đầu)
            // Sử dụng timestamp đã được lưu trong mapped object
            const sorted = mapped.sort((a, b) => {
                if (a.timestamp && b.timestamp) {
                    return b.timestamp - a.timestamp; // Mới nhất lên đầu
                }
                if (a.timestamp) return -1; // a có timestamp, đưa lên đầu
                if (b.timestamp) return 1;  // b có timestamp, đưa lên đầu
                return 0; // Giữ nguyên thứ tự nếu không có timestamp
            });

            // Chỉ hiển thị 3 transactions gần nhất (hoặc ít hơn nếu không đủ)
            const recent = sorted.slice(0, 3);

            console.log("✅ PersonalEWallet: Final recent transactions count:", recent.length);
            if (recent.length > 0) {
                console.log("✅ PersonalEWallet: Recent transactions:", recent);
            }
            setRecentTransactions(recent);
        } catch (err) {
            console.error("❌ PersonalEWallet: Lỗi khi tải lịch sử giao dịch:", err);
            console.error("❌ PersonalEWallet: Error details:", {
                message: err?.message,
                response: err?.response?.data,
                status: err?.response?.status,
            });
            // Không set error để không ảnh hưởng đến UI
            setRecentTransactions([]);
        } finally {
            setLoadingTransactions(false);
        }
    }, []);


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
            fetchRecentTransactions(); // Refresh transactions khi có update
        };

        window.addEventListener("walletUpdated", handleWalletUpdate);

        return () => {
            window.removeEventListener("walletUpdated", handleWalletUpdate);
        };
    }, [fetchRecentTransactions]);

    // Fetch recent transactions khi component mount
    useEffect(() => {
        fetchRecentTransactions();

        // Refresh khi window focus (user quay lại từ tab khác hoặc từ deposit page)
        const handleFocus = () => {
            console.log("🔄 PersonalEWallet: Window focused, refreshing transactions...");
            fetchRecentTransactions();
        };

        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener("focus", handleFocus);
        };
    }, [fetchRecentTransactions]);

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

            {/* Action Buttons - Chỉ hiển thị khi không loading và không có error */}
            {!loading && !error && (
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
                        onClick={() => navigate("/wallet/withdraw")}
                    >
                        <ArrowUpRight size={18} />
                        <span>Rút tiền</span>
                    </button>
                </div>
            )}

            {/* Recent Activity - Luôn hiển thị, không phụ thuộc vào loading state của wallet */}
            <div className="recent-activity-section">
                <h3 className="recent-activity-title">Hoạt động gần đây</h3>
                {loadingTransactions ? (
                    <div className="transactions-loading">
                        <p>Đang tải giao dịch...</p>
                    </div>
                ) : recentTransactions.length > 0 ? (
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
                ) : (
                    <div className="transactions-empty">
                        <p>Chưa có giao dịch nào</p>
                    </div>
                )}
            </div>

            {/* View All Link */}
            {!loading && !error && (
                <div className="view-all-section">
                    <button
                        className="view-all-link"
                        onClick={() => navigate("/wallet")}
                    >
                        Xem tất cả giao dịch
                    </button>
                </div>
            )}

        </div>
    );
}
