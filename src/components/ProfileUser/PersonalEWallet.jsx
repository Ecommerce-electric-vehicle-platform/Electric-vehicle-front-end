import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import profileApi from "../../api/profileApi"

export default function PersonalEWallet() {
    const navigate = useNavigate()
    const [walletData, setWalletData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Format số tiền
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "—"
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount)
    }

    // Format ngày tháng
    const formatDate = (dateString) => {
        if (!dateString) return "—"
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Lấy thông tin ví
    useEffect(() => {
        const fetchWalletData = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await profileApi.getWallet()

                if (response.data && response.data.data) {
                    setWalletData(response.data.data)
                } else {
                    setError("Không thể tải thông tin ví")
                }
            } catch (err) {
                console.error("Lỗi khi tải thông tin ví:", err)
                setError(err.response?.data?.message || "Có lỗi xảy ra khi tải thông tin ví")
            } finally {
                setLoading(false)
            }
        }

        fetchWalletData()

        // 🔄 Lắng nghe event refresh wallet data
        const handleWalletUpdate = () => {
            console.log("🔄 Refreshing wallet data...")
            fetchWalletData()
        }

        window.addEventListener("walletUpdated", handleWalletUpdate)

        return () => {
            window.removeEventListener("walletUpdated", handleWalletUpdate)
        }
    }, [])

    if (loading) {
        return (
            <div style={{ maxWidth: 720 }}>
                <h2 style={{ marginBottom: 16 }}>Personal E-Wallet</h2>
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #f3f3f3',
                        borderTop: '4px solid #2a9d8f',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p>Đang tải thông tin ví...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ maxWidth: 720 }}>
                <h2 style={{ marginBottom: 16 }}>Personal E-Wallet</h2>
                <div style={{
                    border: "1px solid #fecaca",
                    borderRadius: 12,
                    padding: 16,
                    background: "#fef2f2",
                    color: "#dc2626"
                }}>
                    <p style={{ margin: 0 }}>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: 12,
                            padding: "8px 16px",
                            borderRadius: 6,
                            border: "1px solid #dc2626",
                            background: "transparent",
                            color: "#dc2626",
                            cursor: "pointer"
                        }}
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: 720 }}>
            <h2 style={{ marginBottom: 16 }}>Personal E-Wallet</h2>

            <div
                style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    padding: 16,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    background: "#fff",
                }}
            >
                <div>
                    <div style={{ color: "#6b7280" }}>Số dư</div>
                    <div style={{ fontSize: 20, fontWeight: 600 }}>
                        {formatCurrency(walletData?.balance)}
                    </div>
                </div>
                <div>
                    <div style={{ color: "#6b7280" }}>Loại tiền</div>
                    <div style={{ fontSize: 16 }}>
                        {walletData?.concurrency || "VND"}
                    </div>
                </div>
                <div>
                    <div style={{ color: "#6b7280" }}>Nhà cung cấp</div>
                    <div style={{ fontSize: 16 }}>
                        {walletData?.provider || "—"}
                    </div>
                </div>
                <div>
                    <div style={{ color: "#6b7280" }}>Ngày tạo</div>
                    <div style={{ fontSize: 16 }}>
                        {formatDate(walletData?.created_at)}
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <button
                    onClick={() => navigate("/wallet/deposit")}
                    style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "none",
                        background: "#2a9d8f",
                        color: "#fff",
                        cursor: "pointer",
                    }}
                >
                    Nạp tiền
                </button>
                <button
                    disabled
                    style={{
                        padding: "10px 16px",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        background: "#fff",
                        color: "#111827",
                        cursor: "not-allowed",
                    }}
                >
                    Rút tiền (sắp ra mắt)
                </button>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}


