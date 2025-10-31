// src/components/Profile/SellerDocumentView/SellerDocumentView.jsx
"use client";


import { useState, useEffect } from "react";
import profileApi from "../../api/profileApi";
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
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};


// Component chính được dùng cho việc Xem và Chỉnh sửa giấy tờ KYC
export default function SellerDocumentView() {
  const [sellerData, setSellerData] = useState(null);
  const [formData, setFormData] = useState({
    storeName: "",
    businessLicense: null, // File object mới
    storePolicy: null,     // File object mới
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // Chế độ View/Edit
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [filePreviews, setFilePreviews] = useState({}); // Lưu URL preview của file hiện tại/mới
  const [filesToUpload, setFilesToUpload] = useState({}); // Chỉ lưu File object mới được chọn




  // === Fetch Dữ liệu Seller KYC ban đầu ===
  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await profileApi.getSellerKycDocuments();
      const responseData = response.data?.data;


      if (
        responseData &&
        response.data.success &&
        responseData.status === "ACCEPTED"
      ) {
        setSellerData(responseData);
       
        // Khởi tạo formData cho chế độ chỉnh sửa
        setFormData({
          storeName: responseData.storeName || "",
          businessLicense: null,
          storePolicy: null,
        });


        // Khởi tạo previews với URL hiện tại từ server
        const initialPreviews = {};
        documentMap.forEach(doc => {
            if (responseData[doc.key]) {
                initialPreviews[doc.key] = responseData[doc.key];
            }
        });
        setFilePreviews(initialPreviews);


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


  useEffect(() => {
    fetchDocuments();
  }, []);


  // === Handlers ===
  const handleInputChange = (e) => {
    setFormData({ ...formData, storeName: e.target.value });
    setSuccessMessage(null);
  };


  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
        setSuccessMessage(null);
        // Lưu file object vào filesToUpload
        setFilesToUpload(prev => ({ ...prev, [key]: file }));


        // Tạo preview URL
        const previewUrl = URL.createObjectURL(file);
        setFilePreviews(prev => ({ ...prev, [key]: previewUrl }));


        // Hủy bỏ preview cũ nếu có
        const oldUrl = filePreviews[key];
        if (oldUrl && oldUrl.startsWith('blob:')) {
            URL.revokeObjectURL(oldUrl);
        }
    }
  };


  const handleEditClick = () => {
    setIsEditing(true);
    setSuccessMessage(null);
    setError(null);
  };


  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
    setFilesToUpload({}); // Xóa file upload tạm thời
    // Khởi động lại fetch để reset form về trạng thái server
    fetchDocuments();
  };




  // === Submit Update ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);


    try {
      const formBody = new FormData();
     
      // 1. Thêm Tên cửa hàng (dù có thay đổi hay không)
      formBody.append("store_name", formData.storeName);
     
      // 2. Thêm files (chỉ thêm những file mới được chọn)
      if (filesToUpload.businessLicenseUrl) {
          formBody.append("business_license", filesToUpload.businessLicenseUrl, filesToUpload.businessLicenseUrl.name);
      }
      if (filesToUpload.storePolicyUrl) {
          formBody.append("store_policy", filesToUpload.storePolicyUrl, filesToUpload.storePolicyUrl.name);
      }


      // 3. Gọi API cập nhật
      const response = await profileApi.updateSellerKyc(formBody);
      const responseData = response.data?.data;


      if (responseData?.success) {
        setSuccessMessage(responseData.message || "Cập nhật thông tin Seller thành công!");
        setIsEditing(false); // Quay lại chế độ xem
        setFilesToUpload({}); // Xóa files tạm


        // Gọi lại fetch để tải lại dữ liệu chính xác từ server
        fetchDocuments();


      } else {
        const errorMsg = responseData?.message || "Cập nhật thất bại.";
        setError(errorMsg);
      }


    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Lỗi kết nối khi cập nhật.";
        setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };




  // === Render: Loading và Error States ===
  if (isLoading && !sellerData) {
    return (
      <div className="seller-doc-container loading">
        Đang tải giấy tờ kinh doanh...
      </div>
    );
  }


  if (error || !sellerData) {
    return (
      <div className="seller-doc-container error">
        <h2 className="doc-title">Quản lý giấy tờ kinh doanh</h2>
        <p className="error-message">
          {error || "Không tìm thấy thông tin Seller đã duyệt."}
        </p>
      </div>
    );
  }




  // === Render: View/Edit Form ===
  return (
    <div className="seller-doc-container">
      <h2 className="doc-title">Quản lý giấy tờ kinh doanh</h2>
     
      {successMessage && <p className="success-message">{successMessage}</p>}
      {error && <p className="error-message">{error}</p>}
     
      <div className={`doc-status ${sellerData.status.toLowerCase()}`}>
        TÀI KHOẢN ĐÃ ĐƯỢC XÁC MINH 
      </div>


      <form onSubmit={handleSubmit}>
        <div className="doc-info-section">
            <div className="info-header">
                <h3>Thông tin cửa hàng & Người bán</h3>
                {!isEditing && (
                    <button type="button" onClick={handleEditClick} className="btn-edit-docs">
                        Chỉnh sửa
                    </button>
                )}
            </div>
         
            {/* Tên cửa hàng (có thể chỉnh sửa) */}
            <div className="info-item editable">
                <strong>Tên cửa hàng:</strong>
                {isEditing ? (
                    <input
                        type="text"
                        value={formData.storeName}
                        onChange={handleInputChange}
                        className="form-input"
                        name="storeName"
                        required
                    />
                ) : (
                    <span>{sellerData.storeName}</span>
                )}
            </div>
           
            {/* Trường View Only */}
            <div className="info-item">
                <strong>Tên người bán:</strong> <span>{sellerData.sellerName}</span>
            </div>
            <div className="info-item">
                <strong>Mã số thuế:</strong> <span>{sellerData.taxNumber}</span>
            </div>
            <div className="info-item">
                <strong>Quốc tịch:</strong> <span>{sellerData.nationality}</span>
            </div>
            <div className="info-item">
                <strong>Ngày tạo:</strong> <span>{formatDateDisplay(sellerData.createAt)}</span>
            </div>
        </div>


        {/* ======================================= */}
        {/* === DOCUMENTS / IMAGES SECTION === */}
        {/* ======================================= */}
        <div className="doc-images-grid">
          <h3>Giấy tờ xác minh</h3>
          {documentMap.map((doc, index) => {
            // SỬA LỖI ESLINT: KHAI BÁO BIẾN ĐƯỢC DÙNG DƯỚI DẠNG CONST
            const preview = filePreviews[doc.key]; // Preview URL (có thể là blob hoặc server URL)
            const newFile = filesToUpload[doc.key];  // File mới được chọn
           
            // Chỉ cho phép chỉnh sửa Giấy phép KD và Chính sách cửa hàng
            const isEditableDoc = doc.key === 'businessLicenseUrl' || doc.key === 'storePolicyUrl';


            return (
              <div key={index} className="image-card">
                <h4>{doc.label}</h4>
                <div className="image-preview-wrapper">
                    {/* Hiển thị ảnh hiện tại/mới nhất */}
                    <a href={preview} target="_blank" rel="noopener noreferrer">
                        <img
                            src={preview || "https://placehold.co/100x100/eeeeee/333333?text=Không+có+ảnh"}
                            alt={doc.label}
                            className="doc-image-preview"
                            onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/100x100/f87171/ffffff?text=Lỗi+Ảnh"; }}
                        />
                    </a>
                </div>


                {isEditableDoc && isEditing && (
                    <div className="file-edit-controls">
                        <label className="custom-file-upload">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, doc.key)}
                                disabled={isLoading}
                            />
                            {newFile ? `Đã chọn: ${newFile.name}` : 'Thay đổi file'}
                        </label>
                    </div>
                )}
               
                {!isEditing && <p className="image-link-text">Xem chi tiết</p>}
              </div>
            );
          })}
        </div>


        {/* ======================================= */}
        {/* === EDIT BUTTONS === */}
        {/* ======================================= */}
        {isEditing && (
          <div className="form-actions-edit">
            <button
                type="submit"
                className="btn btn-save"
                disabled={isLoading}
            >
              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
            <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-cancel"
                disabled={isLoading}
            >
              Hủy
            </button>
          </div>
        )}
      </form>
    </div>
  );
}



