import { useState, useEffect } from "react";
import profileApi from "../../api/profileApi"; // Sử dụng API đã được cập nhật
import "./SellerDocumentView.css";

// Hàm helper để định nghĩa các tài liệu cần hiển thị
const documentMap = [
  { key: "identityFrontImageUrl", label: "CCCD/CMND Mặt trước" },
  { key: "identityBackImageUrl", label: "CCCD/CMND Mặt sau" },
  { key: "businessLicenseUrl", label: "Giấy phép kinh doanh" },
  { key: "storePolicyUrl", label: "Chính sách cửa hàng" },
  { key: "selfieUrl", label: "Ảnh chân dung (Selfie)" },
];

// Hàm helper để format ngày
const formatDateDisplay = (dateString) => {
    if (!dateString) return "N/A";
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric", month: "numeric", day: "numeric",
        });
    } catch {
        return "N/A";
    }
};

export default function SellerDocumentView() {
  const [sellerData, setSellerData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Gọi API để lấy thông tin KYC đã duyệt
        const response = await profileApi.getSellerKycDocuments();
        const responseData = response.data?.data;

        if (responseData && response.data.success && responseData.status === "ACCEPTED") {
          setSellerData(responseData);
        } else if (responseData && responseData.status === "PENDING") {
          setError("Đơn đăng ký Seller đang chờ duyệt.");
        } else if (responseData && responseData.status === "REJECTED") {
          setError("Đơn đăng ký Seller đã bị từ chối.");
        } else {
          setError("Bạn chưa đăng ký tài khoản Seller.");
        }
      } catch (err) {
        console.error("Failed to fetch seller documents:", err);
        setError("Lỗi kết nối khi tải dữ liệu Seller.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  if (isLoading) {
    return <div className="seller-doc-container loading">Đang tải giấy tờ kinh doanh...</div>;
  }

  if (error || !sellerData) {
    return (
      <div className="seller-doc-container error">
        <h2 className="doc-title">Quản lý giấy tờ kinh doanh</h2>
        <p className="error-message">{error || "Không tìm thấy thông tin Seller đã duyệt."}</p>
      </div>
    );
  }

  return (
    <div className="seller-doc-container">
      <h2 className="doc-title">Quản lý giấy tờ kinh doanh</h2>
      <div className="doc-status accepted">
        Trạng thái: Đã duyệt ({sellerData.status})
      </div>

      <div className="doc-info-section">
        <h3>Thông tin cửa hàng</h3>
        <p><strong>Tên cửa hàng:</strong> {sellerData.storeName}</p>
        <p><strong>Tên người bán:</strong> {sellerData.sellerName}</p>
        <p><strong>Mã số thuế:</strong> {sellerData.taxNumber}</p>
        <p><strong>Quốc tịch:</strong> {sellerData.nationality}</p>
        <p><strong>Ngày tạo:</strong> {formatDateDisplay(sellerData.createAt)}</p>
      </div>
      
      <div className="doc-images-grid">
        <h3>Giấy tờ xác minh (Đã duyệt)</h3>
        {documentMap.map((doc, index) => {
          const url = sellerData[doc.key];
          if (!url) return null; // Ẩn nếu không có URL

          return (
            <div key={index} className="image-card">
              <h4>{doc.label}</h4>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img 
                  src={url} 
                  alt={doc.label} 
                  className="doc-image-preview" 
                  onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/f87171/ffffff?text=Lỗi+Ảnh"; }}
                />
              </a>
              <p className="image-link-text">Xem chi tiết</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
