import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import vnpayApi from "../../api/vnpayApi";
import profileApi from "../../api/profileApi";
import { useWalletBalance } from "../../hooks/useWalletBalance";
import {
    ArrowDownToLine,
    ArrowUpRight,
    ArrowLeftRight,
    CheckCircle2,
    Clock3,
    XCircle,
    Search,
    Download,
    Plus,
    TrendingUp,
    TrendingDown,
    Filter,
    Wallet,
    ArrowUpRight as ExpandIcon,
    ChevronLeft,
    ChevronRight,
    X,
    Copy,
} from "lucide-react";
import "./WalletDashboard.css";

export default function WalletDashboard() {
    const navigate = useNavigate();

    // Sử dụng hook để lấy số dư ví thật
    const { balance, loading: balanceLoading, formatCurrency: formatWalletCurrency, refreshBalance } = useWalletBalance();

    const [inflow, setInflow] = useState(0);
    const [outflow, setOutflow] = useState(0);

    // Transaction data from API
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [transactionError, setTransactionError] = useState(null);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filters
    const [query, setQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("Tất cả loại");
    const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");

    // Pagination - using backend pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Match API default size

    // Modal state
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Map API transaction to UI format
    const mapTransactionFromAPI = (apiTransaction) => {
        if (!apiTransaction) {
            console.warn('⚠️ apiTransaction is null/undefined');
            return null;
        }

        console.log('🔄 Mapping transaction:', apiTransaction);
        console.log('🔄 Transaction keys:', Object.keys(apiTransaction));

        // Map transaction type from API to Vietnamese
        const mapTransactionType = (type) => {
            if (!type) return "Giao dịch";
            const typeMap = {
                "CREDIT": "Nạp tiền",
                "DEBIT": "Thanh toán",
                "DEPOSIT": "Nạp tiền",
                "PAYMENT": "Thanh toán",
                "WITHDRAW": "Rút tiền",
                "TRANSFER": "Chuyển khoản"
            };
            const mapped = typeMap[type?.toUpperCase()] || type || "Giao dịch";
            console.log(`🔄 Type mapping: ${type} -> ${mapped}`);
            return mapped;
        };

        // Map status from API to Vietnamese
        const mapStatus = (status) => {
            if (!status) return "Chưa xác định";
            const statusMap = {
                "SUCCESS": "Thành công",
                "SUCCESSFUL": "Thành công",
                "PENDING": "Đang xử lý",
                "PROCESSING": "Đang xử lý",
                "FAILED": "Thất bại",
                "FAILURE": "Thất bại",
                "CANCELLED": "Đã hủy"
            };
            const mapped = statusMap[status?.toUpperCase()] || status || "Chưa xác định";
            console.log(`🔄 Status mapping: ${status} -> ${mapped}`);
            return mapped;
        };

        // Dịch description từ tiếng Anh sang tiếng Việt
        const translateDescription = (description) => {
            if (!description) return "Giao dịch";

            const descLower = description.toLowerCase().trim();

            // Mapping các description phổ biến từ tiếng Anh sang tiếng Việt
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

            // Tìm bản dịch khớp
            for (const [key, value] of Object.entries(translations)) {
                if (descLower.includes(key)) {
                    return value;
                }
            }

            // Nếu không tìm thấy, trả về mô tả gốc (có thể đã là tiếng Việt)
            return description;
        };

        // Format timestamp
        const formatTimestamp = (timestamp) => {
            if (!timestamp) {
                console.warn('⚠️ No timestamp found');
                return "Chưa có";
            }

            try {
                let date;

                // Nếu timestamp là số (Unix timestamp in milliseconds)
                if (typeof timestamp === 'number') {
                    date = new Date(timestamp);
                }
                // Nếu timestamp là string, thử parse
                else if (typeof timestamp === 'string') {
                    // Thử parse trực tiếp
                    date = new Date(timestamp);

                    // Nếu không thành công, thử parse với các format khác
                    if (isNaN(date.getTime())) {
                        // Thử với format ISO hoặc các format khác
                        const trimmed = timestamp.trim();
                        date = new Date(trimmed);
                    }
                } else {
                    date = new Date(timestamp);
                }

                if (isNaN(date.getTime())) {
                    console.warn('⚠️ Invalid date format:', timestamp, typeof timestamp);
                    return timestamp; // Trả về giá trị gốc nếu không parse được
                }

                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');

                const formatted = `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
                console.log('✅ Formatted timestamp:', timestamp, '->', formatted);
                return formatted;
            } catch (err) {
                console.warn('⚠️ Error formatting timestamp:', err, 'timestamp:', timestamp);
                return timestamp; // Trả về giá trị gốc nếu có lỗi
            }
        };

        const transactionId = apiTransaction.transactionId || apiTransaction.id || apiTransaction.transaction_id || `TXN${Date.now()}`;
        const transactionType = apiTransaction.transactionType || apiTransaction.type || apiTransaction.transaction_type;
        const rawDescription = apiTransaction.description || apiTransaction.note || apiTransaction.reason || apiTransaction.detail || "Giao dịch";
        const description = translateDescription(rawDescription); // Dịch description sang tiếng Việt

        // Tìm timestamp từ nhiều field names có thể có
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

        // Nếu vẫn không tìm thấy, tự động tìm field có giá trị giống date
        if (!timestamp) {
            console.warn('⚠️ Không tìm thấy timestamp với các field names chuẩn, đang tìm tự động...');
            console.log('🔍 Tất cả các field trong transaction:', apiTransaction);

            // Thử tìm trong tất cả các field có tên liên quan đến date/time
            for (const [key, value] of Object.entries(apiTransaction)) {
                if (!value) continue;

                const lowerKey = key.toLowerCase();
                // Mở rộng danh sách từ khóa tìm kiếm
                if (lowerKey.includes('date') ||
                    lowerKey.includes('time') ||
                    lowerKey.includes('created') ||
                    lowerKey.includes('timestamp') ||
                    lowerKey.includes('update') ||
                    lowerKey === 'when' ||
                    lowerKey === 'at') {
                    // Thử parse như date
                    const testDate = new Date(value);
                    if (!isNaN(testDate.getTime())) {
                        timestamp = value;
                        console.log(`✅ Tìm thấy timestamp tự động trong field: ${key}`, value);
                        break;
                    }
                }
            }

            // Nếu vẫn chưa tìm thấy, thử tìm trong TẤT CẢ các field (không phân biệt tên)
            if (!timestamp) {
                console.warn('⚠️ Không tìm thấy với field names liên quan, đang kiểm tra TẤT CẢ các field...');
                for (const [key, value] of Object.entries(apiTransaction)) {
                    if (!value || value === apiTransaction.id || value === apiTransaction.transactionId) continue;

                    // Bỏ qua các field không phải date
                    if (typeof value === 'number' && value > 1000000000000) {
                        // Có thể là Unix timestamp (milliseconds)
                        const testDate = new Date(value);
                        if (!isNaN(testDate.getTime()) && testDate.getFullYear() > 2000 && testDate.getFullYear() < 2100) {
                            timestamp = value;
                            console.log(`✅ Tìm thấy timestamp (number) trong field: ${key}`, value);
                            break;
                        }
                    } else if (typeof value === 'string') {
                        // Thử parse string như date
                        const testDate = new Date(value);
                        if (!isNaN(testDate.getTime()) && testDate.getFullYear() > 2000 && testDate.getFullYear() < 2100) {
                            // Kiểm tra xem có phải là date hợp lệ không (năm từ 2000-2100)
                            timestamp = value;
                            console.log(`✅ Tìm thấy timestamp (string) trong field: ${key}`, value);
                            break;
                        }
                    }
                }
            }

            if (!timestamp) {
                console.error('❌ KHÔNG TÌM THẤY TIMESTAMP trong transaction:', {
                    transaction: apiTransaction,
                    availableKeys: Object.keys(apiTransaction),
                    allFields: JSON.stringify(apiTransaction, null, 2)
                });
                console.error('⚠️ Backend có thể không trả về timestamp field. Vui lòng kiểm tra API response.');
                // Fallback: Sử dụng thời gian hiện tại (tạm thời cho đến khi backend fix)
                // timestamp = new Date().toISOString();
            }
        } else {
            console.log('✅ Tìm thấy timestamp:', {
                timestamp,
                fieldName: Object.keys(apiTransaction).find(key => {
                    const val = apiTransaction[key];
                    return val === timestamp;
                })
            });
        }

        const amount = Number(apiTransaction.amount) || 0;
        const status = apiTransaction.status || apiTransaction.transactionStatus;

        const mapped = {
            id: transactionId,
            type: mapTransactionType(transactionType),
            note: description,
            time: formatTimestamp(timestamp),
            amount: amount,
            status: mapStatus(status),
            // Keep original fields for filtering
            originalType: transactionType,
            originalStatus: status
        };

        console.log('✅ Mapped result:', mapped);
        return mapped;
    };

    // Fetch transactions from API
    const fetchTransactions = useCallback(async (page = 1, size = 10) => {
        try {
            setLoadingTransactions(true);
            setTransactionError(null);

            console.log('🔍 Fetching transaction history...', { page, size });
            const response = await profileApi.getTransactionHistory(page, size);

            // Log full response structure for debugging
            console.log('✅ Full API Response Object:', response);
            console.log('✅ Response.data:', response?.data);
            console.log('✅ Response.data.data:', response?.data?.data);
            console.log('✅ Response.data.data?.content:', response?.data?.data?.content);
            console.log('✅ Response.data.data?.totalElements:', response?.data?.data?.totalElements);
            console.log('✅ Response keys:', Object.keys(response?.data || {}));
            if (response?.data?.data) {
                console.log('✅ Response.data.data keys:', Object.keys(response?.data?.data));
            }

            // Log stringified response to see exact structure
            try {
                console.log('✅ Stringified response.data:', JSON.stringify(response?.data, null, 2));
            } catch (e) {
                console.warn('⚠️ Cannot stringify response:', e);
            }

            // Parse response structure - handle multiple possible structures
            let responseData = null;
            let content = [];

            // Try different response structures
            if (response?.data?.data) {
                // Standard structure: { success: true, data: { content: [], ... } }
                responseData = response.data.data;
                content = responseData.content || [];

                // Check if content is actually empty or if it's in a different field
                if (Array.isArray(content) && content.length === 0) {
                    console.warn('⚠️ Content array is empty, checking alternative fields...');
                    // Check for alternative field names
                    const possibleFields = ['transactions', 'items', 'results', 'data', 'list'];
                    for (const field of possibleFields) {
                        if (Array.isArray(responseData[field]) && responseData[field].length > 0) {
                            console.log(`✅ Found transactions in field: ${field}`);
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

            console.log('📦 Response parsing result:', {
                hasResponseData: !!responseData,
                contentLength: content.length,
                contentIsArray: Array.isArray(content),
                responseDataKeys: responseData ? Object.keys(responseData) : [],
                totalElements: responseData?.totalElements,
                totalPages: responseData?.totalPages,
                fullResponseData: responseData
            });

            if (!responseData) {
                console.error('❌ Invalid response structure - responseData is null/undefined');
                console.error('Full response:', JSON.stringify(response, null, 2));
                setTransactions([]);
                setTotalElements(0);
                setTotalPages(0);
                return;
            }

            console.log('📦 Content array:', content);
            console.log('📦 Content length:', content.length);

            if (content.length > 0) {
                console.log('📦 First transaction sample:', content[0]);
                console.log('📦 First transaction keys:', Object.keys(content[0]));
                console.log('📦 First transaction values:', content[0]);

                // Log chi tiết từng field để tìm timestamp
                console.log('📦 Chi tiết các field trong transaction đầu tiên:');
                Object.entries(content[0]).forEach(([key, value]) => {
                    console.log(`  - ${key}:`, value, `(type: ${typeof value})`);
                });
            } else {
                console.warn('⚠️ Content array is empty!');
                console.warn('⚠️ But totalElements:', responseData?.totalElements);
                console.warn('⚠️ Full responseData:', responseData);

                // This might be a backend bug - content empty but totalElements > 0
                // Let's check if we need to handle this differently
                if (responseData?.totalElements > 0 && content.length === 0) {
                    console.error('❌ BACKEND BUG DETECTED: totalElements > 0 but content is empty!');
                    console.error('❌ This suggests the backend has a pagination issue');
                    console.error('❌ Response structure:', {
                        totalElements: responseData.totalElements,
                        totalPages: responseData.totalPages,
                        currentPage: page,
                        pageSize: size,
                        contentLength: content.length,
                        numberOfElements: responseData.numberOfElements,
                        empty: responseData.empty,
                        pageable: responseData.pageable
                    });

                    // WORKAROUND: Try to fetch with page 0 if we're on page 1
                    // Some backends use 0-based pagination
                    if (page === 1) {
                        console.log('🔧 Attempting workaround: Trying page 0 (0-based pagination)...');
                        try {
                            const retryResponse = await profileApi.getTransactionHistory(0, size);
                            const retryData = retryResponse?.data?.data;
                            if (retryData?.content && retryData.content.length > 0) {
                                console.log('✅ Workaround succeeded! Found content with page 0');
                                content = retryData.content;
                                responseData = retryData;
                            }
                        } catch (retryError) {
                            console.warn('⚠️ Workaround failed:', retryError);
                        }
                    }
                }
            }

            const mappedTransactions = content
                .map((tx, index) => {
                    try {
                        const mapped = mapTransactionFromAPI(tx);
                        console.log(`📝 Transaction ${index + 1} mapped:`, mapped);
                        return mapped;
                    } catch (err) {
                        console.error(`❌ Error mapping transaction ${index + 1}:`, err, tx);
                        return null;
                    }
                })
                .filter(tx => tx !== null && tx !== undefined); // Filter out null/undefined values

            console.log('✅ Total mapped transactions:', mappedTransactions.length);
            console.log('✅ All mapped transactions:', mappedTransactions);
            console.log('✅ Transactions state will be set to:', mappedTransactions);

            // Set transactions state
            setTransactions(mappedTransactions);

            // Set pagination info
            const totalEl = responseData.totalElements !== undefined ? responseData.totalElements : mappedTransactions.length;
            const totalPg = responseData.totalPages !== undefined ? responseData.totalPages : (totalEl > 0 ? 1 : 0);

            setTotalElements(totalEl);
            setTotalPages(totalPg);

            // If we have totalElements but no mapped transactions, this is a backend issue
            if (totalEl > 0 && mappedTransactions.length === 0 && content.length === 0) {
                console.error('❌ BACKEND ISSUE: Backend reports transactions exist but content array is empty');
                console.error('❌ This needs to be fixed on the backend side');
                setTransactionError('Lỗi từ phía máy chủ: Dữ liệu giao dịch không được trả về đúng cách. Vui lòng thử lại sau.');
            }

            console.log('📄 Pagination set:', {
                totalElements: totalEl,
                totalPages: totalPg,
                currentPage: page
            });

            // Calculate inflow and outflow from all transactions
            const allInflow = content
                .filter(t => (t.transactionType || t.type || "").toUpperCase() === "CREDIT" || (t.amount || 0) > 0)
                .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

            const allOutflow = content
                .filter(t => (t.transactionType || t.type || "").toUpperCase() === "DEBIT" || (t.amount || 0) < 0)
                .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

            setInflow(allInflow);
            setOutflow(allOutflow);

            console.log('💰 Inflow:', allInflow, 'Outflow:', allOutflow);
        } catch (error) {
            console.error('❌ Error fetching transaction history:', error);
            console.error('❌ Error details:', error?.response?.data || error?.message);
            setTransactionError('Không thể tải lịch sử giao dịch');
            setTransactions([]);
            setTotalElements(0);
            setTotalPages(0);
        } finally {
            setLoadingTransactions(false);
        }
    }, []);

    // Fetch transactions when page changes
    useEffect(() => {
        fetchTransactions(currentPage, itemsPerPage);
    }, [currentPage, fetchTransactions, itemsPerPage]);

    // Client-side filtering for search and type/status filters
    const filtered = useMemo(() => {
        console.log('🔍 Starting filter process:', {
            transactionsCount: transactions.length,
            query: query,
            typeFilter: typeFilter,
            statusFilter: statusFilter,
            transactions: transactions
        });

        const result = transactions.filter(t => {
            // Check each condition individually for debugging
            const matchText = !query || (`${t.id} ${t.type} ${t.note}`).toLowerCase().includes(query.toLowerCase());
            const matchType = typeFilter === "Tất cả loại" || t.type === typeFilter;
            const matchStatus = statusFilter === "Tất cả trạng thái" || t.status === statusFilter;

            const matches = matchText && matchType && matchStatus;

            if (!matches) {
                console.log(`❌ Transaction ${t.id} filtered out:`, {
                    matchText,
                    matchType,
                    matchStatus,
                    transactionType: t.type,
                    transactionStatus: t.status,
                    typeFilter,
                    statusFilter
                });
            }

            return matches;
        });

        console.log('🔍 Filter result:', {
            total: transactions.length,
            filtered: result.length,
            query,
            typeFilter,
            statusFilter,
            result: result
        });

        return result;
    }, [transactions, query, typeFilter, statusFilter]);

    // Debug: Log when transactions change
    useEffect(() => {
        console.log('📊 Transactions state updated:', {
            count: transactions.length,
            transactions: transactions
        });
    }, [transactions]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [query, typeFilter, statusFilter]);

    // Disable scroll when modal is open
    useEffect(() => {
        if (isModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        // Cleanup on unmount
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isModalOpen]);

    // Handle open modal
    const handleOpenModal = (transaction) => {
        setSelectedTransaction(transaction);
        setIsModalOpen(true);
    };

    // Handle close modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTransaction(null);
    };

    // Handle copy transaction ID
    const handleCopyTransactionId = async (transactionId) => {
        try {
            await navigator.clipboard.writeText(transactionId);
            // Có thể thêm toast notification ở đây
            alert("Đã sao chép mã giao dịch!");
        } catch (err) {
            console.error('Failed to copy:', err);
            alert("Không thể sao chép mã giao dịch");
        }
    };

    const fmt = (v) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v);

    const statusPill = (status) => {
        if (status === "Thành công") return <span className="pill pill-success"><CheckCircle2 size={14} /> Thành công</span>;
        if (status === "Đang xử lý") return <span className="pill pill-warning"><Clock3 size={14} /> Đang xử lý</span>;
        return <span className="pill pill-danger"><XCircle size={14} /> Thất bại</span>;
    };

    const typeIcon = (type) => {
        if (type === "Nạp tiền") return <ArrowDownToLine size={18} className="icon in" />;
        if (type === "Rút tiền") return <ArrowUpRight size={18} className="icon out" />;
        return <ArrowLeftRight size={18} className="icon transfer" />;
    };

    // Reserved for future use - top up functionality
    const _handleTopUp = async () => {
        const amount = prompt("Nhập số tiền cần nạp (VND):");
        if (!amount || Number(amount) <= 0) return;
        try {
            const res = await vnpayApi.createPayment(Number(amount));
            const url = res?.data?.data?.url_payment || res?.data?.paymentUrl || res?.data?.url;
            if (url) window.location.href = url; else alert("Không nhận được đường dẫn thanh toán");
        } catch {
            alert("Tạo yêu cầu thanh toán thất bại");
        }
    };

    return (
        <div className="wallet-page">
            <div className="page-head">
                <h1>Ví của tôi</h1>
                <p>Quản lý và theo dõi giao dịch của bạn</p>
            </div>

            {/* Wallet Balance Card */}
            <div className="balance-card">
                <div className="balance-header">
                    <div className="balance-header-left">
                        <Wallet size={20} className="wallet-icon" />
                        <span className="balance-label">Số dư ví</span>
                    </div>
                    <button className="expand-btn" onClick={refreshBalance}>
                        <ExpandIcon size={18} />
                    </button>
                </div>
                <div className="balance-amount-wrapper">
                    <div className="balance-amount">
                        {balanceLoading ? (
                            <span className="loading-text">Đang tải...</span>
                        ) : (
                            formatWalletCurrency(balance)
                        )}
                    </div>
                    <div className="balance-subtitle">Số dư khả dụng</div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary">
                <div className="metric in">
                    <div className="metric-icon-wrapper">
                        <TrendingUp size={24} className="metric-icon" />
                    </div>
                    <div className="metric-content">
                        <div className="metric-title">Tiền vào</div>
                        <div className="metric-value">{fmt(inflow)}</div>
                    </div>
                </div>
                <div className="metric out">
                    <div className="metric-icon-wrapper">
                        <TrendingDown size={24} className="metric-icon" />
                    </div>
                    <div className="metric-content">
                        <div className="metric-title">Tiền ra</div>
                        <div className="metric-value">{fmt(outflow)}</div>
                    </div>
                </div>
            </div>

            {/* Action Buttons - Nạp tiền và Rút tiền */}
            <div className="wallet-action-buttons">
                <button
                    className="wallet-action-btn wallet-deposit-btn"
                    onClick={() => navigate("/wallet/deposit")}
                >
                    <Plus size={18} />
                    <span>Nạp tiền</span>
                </button>
                <button
                    className="wallet-action-btn wallet-withdraw-btn"
                    onClick={() => {
                        // TODO: Navigate to withdraw page when available
                        alert("Tính năng rút tiền sẽ sớm được cập nhật!");
                    }}
                >
                    <ArrowUpRight size={18} />
                    <span>Rút tiền</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="search-toolbar">
                <div className="search-wrapper">
                    <div className="search-icon-left">
                        <Search size={18} className="search-icon" />
                    </div>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm kiếm theo mã giao dịch hoặc nội dung..."
                        className="search-input"
                    />
                </div>
                <button className="filter-btn" aria-label="Bộ lọc">
                    <Filter size={20} />
                </button>
            </div>

            {/* Filter Dropdowns */}
            <div className="filter-toolbar">
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="filter-select"
                >
                    <option>Tất cả loại</option>
                    <option>Nạp tiền</option>
                    <option>Thanh toán</option>
                    <option>Chuyển khoản</option>
                    <option>Rút tiền</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                >
                    <option>Tất cả trạng thái</option>
                    <option>Thành công</option>
                    <option>Đang xử lý</option>
                    <option>Thất bại</option>
                </select>
            </div>

            <h2 className="list-title">
                Lịch sử giao dịch ({loadingTransactions ? "..." : totalElements})
            </h2>

            <div className="tx-list">
                {loadingTransactions ? (
                    <div className="empty-state">
                        <p>Đang tải lịch sử giao dịch...</p>
                    </div>
                ) : transactionError ? (
                    <div className="empty-state">
                        <p style={{ color: 'var(--color-danger, #ef4444)' }}>{transactionError}</p>
                    </div>
                ) : (() => {
                    // Debug: Log render state
                    console.log('🎨 Rendering tx-list:', {
                        loadingTransactions,
                        transactionError,
                        transactionsCount: transactions.length,
                        filteredCount: filtered.length,
                        totalElements,
                        transactions,
                        filtered
                    });

                    // Use transactions directly if filtered is empty but transactions exist
                    // This helps identify if filtering is the issue
                    const displayTransactions = filtered.length > 0 ? filtered : transactions;

                    if (displayTransactions.length === 0) {
                        return (
                            <div className="empty-state">
                                <p>Không tìm thấy giao dịch nào</p>
                            </div>
                        );
                    }

                    return displayTransactions.map((t) => {
                        console.log('🎨 Rendering transaction:', t);
                        return (
                            <div
                                key={t.id}
                                className="tx-item"
                                onClick={() => handleOpenModal(t)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="tx-left">
                                    <div className="tx-icon">{typeIcon(t.type)}</div>
                                    <div className="tx-info">
                                        <div className="tx-title">{t.type}</div>
                                        <div className="tx-note">{t.note}</div>
                                        <div className="tx-time">{t.time}</div>
                                    </div>
                                </div>
                                <div className="tx-right">
                                    <div className={`tx-amount ${t.amount > 0 ? "positive" : "negative"}`}>
                                        {t.amount > 0 ? "+" : "-"} {fmt(Math.abs(t.amount))}
                                    </div>
                                    <div>{statusPill(t.status)}</div>
                                </div>
                            </div>
                        );
                    });
                })()}
            </div>

            {/* Pagination - using backend pagination */}
            {!loadingTransactions && !transactionError && totalElements > 0 && (
                <div className="pagination">
                    <div className="pagination-info">
                        Hiển thị {((currentPage - 1) * itemsPerPage) + 1} đến {Math.min(currentPage * itemsPerPage, totalElements)} trong tổng số {totalElements} kết quả
                    </div>
                    <div className="pagination-controls">
                        <button
                            className="pagination-btn"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            aria-label="Trang trước"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            // Show pages around current page
                            let page;
                            if (totalPages <= 5) {
                                page = i + 1;
                            } else if (currentPage <= 3) {
                                page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                page = totalPages - 4 + i;
                            } else {
                                page = currentPage - 2 + i;
                            }
                            return (
                                <button
                                    key={page}
                                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                    aria-label={`Trang ${page}`}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        {totalPages > 5 && currentPage < totalPages - 2 && (
                            <>
                                <span className="pagination-ellipsis">...</span>
                                <button
                                    className={`pagination-number ${currentPage === totalPages ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(totalPages)}
                                    aria-label={`Trang ${totalPages}`}
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}
                        <button
                            className="pagination-btn"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            aria-label="Trang sau"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Transaction Detail Modal */}
            {isModalOpen && selectedTransaction && (
                <div className="transaction-modal-overlay" onClick={handleCloseModal}>
                    <div className="transaction-modal-content" onClick={(e) => e.stopPropagation()}>
                        {/* Close Button */}
                        <button className="transaction-modal-close" onClick={handleCloseModal}>
                            <X size={20} />
                        </button>

                        {/* Modal Header */}
                        <h2 className="transaction-modal-title">Chi tiết giao dịch</h2>

                        {/* Amount */}
                        <div className="transaction-modal-amount">
                            {selectedTransaction.amount > 0 ? "+" : ""}
                            {fmt(selectedTransaction.amount)}
                        </div>

                        {/* Status Badge */}
                        <div className="transaction-modal-status-wrapper">
                            {statusPill(selectedTransaction.status)}
                        </div>

                        {/* Transaction Details */}
                        <div className="transaction-modal-details">
                            <div className="transaction-detail-row">
                                <span className="transaction-detail-label">Loại giao dịch</span>
                                <span className="transaction-detail-value">{selectedTransaction.type}</span>
                            </div>

                            <div className="transaction-detail-divider"></div>

                            <div className="transaction-detail-row">
                                <span className="transaction-detail-label">Mã giao dịch</span>
                                <div className="transaction-detail-value-with-action">
                                    <span className="transaction-detail-value">{selectedTransaction.id}</span>
                                    <button
                                        className="transaction-copy-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopyTransactionId(selectedTransaction.id);
                                        }}
                                        title="Sao chép mã giao dịch"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="transaction-detail-divider"></div>

                            <div className="transaction-detail-row">
                                <span className="transaction-detail-label">Thời gian</span>
                                <span className="transaction-detail-value">{selectedTransaction.time}</span>
                            </div>

                            <div className="transaction-detail-divider"></div>

                            <div className="transaction-detail-row">
                                <span className="transaction-detail-label">Nội dung</span>
                                <span className="transaction-detail-value">{selectedTransaction.note}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
