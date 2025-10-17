import { useNavigate } from "react-router-dom"

export default function PersonalEWallet() {
    const navigate = useNavigate()

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
                    <div style={{ fontSize: 20, fontWeight: 600 }}>—</div>
                </div>
                <div>
                    <div style={{ color: "#6b7280" }}>Loại tiền</div>
                    <div style={{ fontSize: 16 }}>VND</div>
                </div>
                <div>
                    <div style={{ color: "#6b7280" }}>Cập nhật gần nhất</div>
                    <div style={{ fontSize: 16 }}>—</div>
                </div>
                <div>
                    <div style={{ color: "#6b7280" }}>Trạng thái</div>
                    <div style={{ fontSize: 16 }}>Đang hoạt động</div>
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
        </div>
    )
}


