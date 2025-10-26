"use client";

import "./SellerApplicationPending.css"; // Giữ lại CSS

export default function SellerApplicationPending({ data }) { // Nhận 'data' từ prop
    const sellerData = data;

    const formatDate = (dateString) => {
        if (!dateString) return "Không rõ";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Ngày không hợp lệ";
            return date.toLocaleDateString("vi-VN", {
                year: "numeric", month: "long", day: "numeric",
            });
        } catch (e) {
            console.error("Error formatting date:", e);
            return "Lỗi định dạng ngày";
        }
    };

    if (!sellerData) {
        return <div className="loading seller-container">Đang tải thông tin...</div>;
    }

    return (
        <div className="seller-container">
            {/* Header */}
            <div className="seller-header">
                <h1 className="seller-title">Trở Thành Người Bán</h1>
            </div>

            {/* Status Section */}
            <div className="seller-card">
                <div className="status-section">
                    <div className="status-header">
                        <span className="status-icon pending">⏱</span>
                        <span className="status-text">
                            Yêu cầu trở thành người bán - <span className="status-label pending">Đang chờ duyệt</span>
                        </span>
                    </div>
                    <p className="status-message">
                        Yêu cầu của bạn đang được xem xét. Chúng tôi sẽ phản hồi trong vòng 2-3 ngày làm việc.
                    </p>
                </div>
            </div>

            {/* Customer Information (Giống hệt ảnh bạn cung cấp) */}
            <div className="seller-card info-card">
                <div className="info-section" style={{ gap: '15px' }}> {/* Thêm gap để khớp ảnh */}
                    <div className="info-item">
                        <p className="info-value">Khách hàng: {sellerData.fullName || "..."}</p> {/* Lấy từ fullName */}
                    </div>
                    <div className="info-item">
                        <p className="info-value">Tên kinh doanh: {sellerData.storeName || "..."}</p> {/* Lấy từ storeName */}
                    </div>
                    <div className="info-item">
                        <p className="info-value">Ngày điền đơn: {formatDate(sellerData.createAt)}</p> {/* Sửa thành createAt */}
                    </div>
                </div>
            </div>
        </div>
    );
}