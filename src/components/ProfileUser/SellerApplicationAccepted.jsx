"use client";

import "./SellerApplicationAccepted.css"; // Giữ lại CSS

export default function SellerApplicationAccepted({ data, onComplete }) {
  // Nhận 'data' và callback 'onComplete'
  const sellerData = data;

  // Hàm format ngày (giữ lại)
  const formatDate = (dateString) => {
    if (!dateString) return "Không rõ";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Ngày không hợp lệ";
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Lỗi định dạng ngày";
    }
  };

  // Kiểm tra nếu data không có (phòng trường hợp lỗi)
  if (!sellerData) {
    return (
      <div className="loading seller-container">Đang tải thông tin...</div>
    );
  }

  // Xử lý nút "Hoàn tất"
  const handleComplete = () => {
    console.log("Hoàn tất tác vụ - KYC Accepted. Navigating...");

    // === CẬP NHẬT ROLE TRONG LOCALSTORAGE ===
    // Backend đã cập nhật role trong DB, frontend cần sync localStorage
    localStorage.setItem("userRole", "seller");
    console.log("Role updated in localStorage: buyer → seller");

    // Bắn event để các component khác (như Header) cập nhật UI ngay lập tức
    window.dispatchEvent(
      new CustomEvent("roleChanged", { detail: { role: "seller" } })
    );
    window.dispatchEvent(new CustomEvent("authStatusChanged")); // Trigger full auth update

    // Gọi callback để component cha (PersonalProfilePage) chuyển hướng
    if (onComplete) {
      onComplete(); // Gọi hàm handleKycAccepted ở PersonalProfilePage
    }
  };

  // === UI ===
  return (
    <div className="seller-container">
      {/* Header */}
      <div className="seller-header">
        <h1 className="seller-title">Trở thành người bán</h1>
      </div>

      {/* Status Text */}
      <div
        className="status-text-accepted"
        style={{ marginBottom: "20px", textAlign: "center" }}
      >
        Trạng thái duyệt tài khoản:{" "}
        <span className="status-label accepted">Chấp nhận</span>
      </div>

      {/* Customer Information */}
      <div className="seller-card info-card accepted-info-card">
        <div className="info-section" style={{ gap: "15px" }}>
          <div className="info-item">
            <p className="info-value">
              Khách hàng: {sellerData.fullName || "..."}
            </p>
          </div>
          <div className="info-item">
            <p className="info-value">
              Tên kinh doanh: {sellerData.storeName || "..."}
            </p>
          </div>
          <div className="info-item">
            <p className="info-value">
              Ngày duyệt đơn:{" "}
              {formatDate(sellerData.updatedAt || sellerData.createAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="button-container">
        <button
          className="btn btn-primary accepted-screen-button"
          onClick={handleComplete}
        >
          Hoàn tất thao tác
        </button>
      </div>
    </div>
  );
}
