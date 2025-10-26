"use client";

import "./SellerApplicationAccepted.css"; // Giữ lại CSS

export default function SellerApplicationAccepted({ data, onComplete }) { // Nhận 'data' từ prop
    const sellerData = data;

    // Hàm format ngày (giữ lại)
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

    // Kiểm tra nếu data không có (phòng trường hợp lỗi)
    if (!sellerData) {
        return <div className="loading seller-container">Đang tải thông tin...</div>;
        // return <div className="seller-container form-message error">Không có dữ liệu người bán.</div>;
    }

    // Xử lý nút "Hoàn tất" (tạm thời chỉ log)
    const handleComplete = () => {
        console.log("Hoàn tất tác vụ - Đã nâng cấp thành Seller!");


        // Lưu trạng thái seller vào localStorage
        localStorage.setItem('userRole', 'seller');
        // --- KẾT THÚC THÊM ---

        // (Tùy chọn) Thông báo hoặc chuyển hướng
        //alert("Chúc mừng! Tài khoản của bạn đã được nâng cấp thành Người bán.");

        // Có thể bắn thêm event để Header cập nhật ngay lập tức nếu cần
        window.dispatchEvent(new CustomEvent("roleChanged", { detail: { role: 'seller' } }));

        if (onComplete) {
            onComplete(); // Đây chính là hàm handleKycAccepted ở File 6
        }
    };

    return (
        // Sử dụng class seller-container để áp dụng CSS chung
        <div className="seller-container">
            {/* Header */}
            <div className="seller-header">
                <h1 className="seller-title">Trở thành người bán</h1>
            </div>

            {/* Status Text (Giống ảnh) */}
            {/* Cần CSS để căn chỉnh và tạo màu xanh */}
            <div className="status-text-accepted" style={{ marginBottom: '20px', textAlign: 'center' }}> {/* Thêm style tạm */}
                Trạng thái duyệt tài khoản: <span className="status-label accepted">Chấp nhận</span>
            </div>


            {/* Customer Information (Giống ảnh) */}
            <div className="seller-card info-card accepted-info-card"> {/* Thêm class để style riêng nếu cần */}
                <div className="info-section" style={{ gap: '15px' }}>
                    <div className="info-item">
                        {/* Đã bỏ label, gộp vào text */}
                        <p className="info-value">Khách hàng: {sellerData.fullName || "..."}</p>
                    </div>
                    <div className="info-item">
                        <p className="info-value">Tên kinh doanh: {sellerData.storeName || "..."}</p>
                    </div>
                    <div className="info-item">
                        {/* Hiển thị ngày duyệt (updatedAt) nếu có, nếu không thì ngày tạo (createAt) */}
                        <p className="info-value">Ngày duyệt đơn: {formatDate(sellerData.updatedAt || sellerData.createAt)}</p>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="button-container">
                {/* Sử dụng class CSS bạn đã định nghĩa */}
                <button className="btn btn-primary accepted-screen-button" onClick={handleComplete}>
                    Hoàn tất thao tác
                </button>
            </div>
        </div>
    );
}