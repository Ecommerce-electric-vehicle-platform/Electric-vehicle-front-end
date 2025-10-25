"use client";

// 🔹 1. Import useEffect và useNavigate
import { useState, useEffect } from "react";
//import { useNavigate } from "react-router-dom";
import "./UpgradeToSeller.css";
import PolicyModal from "./PolicyModal"; // Đảm bảo component này tồn tại và đúng đường dẫn
import profileApi from "../../api/profileApi";

export default function UpgradeToSeller({ onGoToProfile }) {
  const [formData, setFormData] = useState({
    storeName: "",
    taxNumber: "",
    identityNumber: "",
    frontOfIdentity: null,
    backOfIdentity: null,
    businessLicense: null,
    selfie: null,
    storePolicy: null,
  });

  const [errors, setErrors] = useState({});
  const [agreePolicy, setAgreePolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState({
    frontOfIdentity: null,
    backOfIdentity: null,
    businessLicense: null,
    selfie: null,
    storePolicy: null,
  });

  // State cho quá trình gửi form
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingMessage, setShowLoadingMessage] = useState(false);

  // 🔹 2. Thêm state để kiểm tra hồ sơ
  const [isProfileComplete, setIsProfileComplete] = useState(null); // null = đang kiểm tra, true = hoàn thành, false = chưa hoàn thành
  const [checkingProfile, setCheckingProfile] = useState(true); // State loading cho việc kiểm tra ban đầu

  // 🔹 3. Thêm hook useNavigate
  //const navigate = useNavigate();

  // Regex
  const regex = {
    storeName: /^[A-Za-z0-9\s\u00C0-\u1EF9]{2,50}$/,
    taxNumber: /^[0-9]{10,13}$/,
    identityNumber: /^[0-9]{9,12}$/,
  };

  // 🔹 4. useEffect để kiểm tra hồ sơ khi component tải
  useEffect(() => {
    const checkProfileStatus = async () => {
      setCheckingProfile(true);
      try {
        const response = await profileApi.getProfile();
        const responseBody = response.data;

        if (!responseBody.success) {
          throw new Error(responseBody.message || "Không thể xác minh trạng thái hồ sơ.");
        }

        const profileData = responseBody.data;
        console.log("DEBUG: Profile data from API:", profileData);

        // Kiểm tra điều kiện hoàn thành hồ sơ chặt chẽ
        let isComplete = false;
        if (profileData) {
          const hasFullName = profileData.fullName && String(profileData.fullName).trim() !== "";
          const hasPhoneNumber = profileData.phoneNumber && String(profileData.phoneNumber).trim() !== "";
          const hasEmail = profileData.email && String(profileData.email).trim() !== "";
          const hasDob = profileData.dob && String(profileData.dob).trim() !== "";
          const hasAddress = profileData.defaultShippingAddress && String(profileData.defaultShippingAddress).trim() !== "";
          const hasAvatar = profileData.avatarUrl && String(profileData.avatarUrl).trim() !== "";

          console.log("DEBUG: Profile fields check:", { hasFullName, hasPhoneNumber, hasEmail, hasDob, hasAddress, hasAvatar });
          isComplete = hasFullName && hasPhoneNumber && hasEmail && hasDob && hasAddress && hasAvatar;
        }

        if (isComplete) {
          console.log("DEBUG: Profile check PASSED. Rendering Upgrade Form.");
          setIsProfileComplete(true);
        } else {
          console.log("DEBUG: Profile check FAILED. Rendering Incomplete Notice.");
          setIsProfileComplete(false);
        }

      } catch (error) {
        console.error("DEBUG: Error during profile check or profile incomplete:", error.message);
        setIsProfileComplete(false);
      } finally {
        setCheckingProfile(false);
      }
    };
    checkProfileStatus();
  }, []);

  // handleInputChange - Đã sửa lỗi ESLint
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, [name]: "This field is required." }));
    } else if (regex[name] && !regex[name].test(value)) {
      setErrors((prev) => ({
        ...prev,
        [name]:
          name === "storeName"
            ? "Store name must be 2–50 characters, letters & numbers only."
            : name === "taxNumber"
              ? "Tax number must be 10–13 digits."
              : "Identity number must be 9–12 digits.",
      }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // handleFileUpload
  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [fieldName]: file }));
      setUploadedFiles((prev) => ({ ...prev, [fieldName]: file.name }));
      setErrors((prev) => ({ ...prev, [fieldName]: "" })); // Xóa lỗi khi chọn file
    } else {
      setFormData((prev) => ({ ...prev, [fieldName]: null }));
      setUploadedFiles((prev) => ({ ...prev, [fieldName]: null }));
      // Không xóa lỗi nếu người dùng cancel
    }
  };

  // validateForm
  const validateForm = () => {
    const newErrors = {};
    if (!formData.storeName.trim()) {
      newErrors.storeName = "Store name is required.";
    } else if (!regex.storeName.test(formData.storeName)) {
      newErrors.storeName = "Store name must be 2–50 characters, letters & numbers only.";
    }

    if (!formData.taxNumber.trim()) {
      newErrors.taxNumber = "Tax number is required.";
    } else if (!regex.taxNumber.test(formData.taxNumber)) {
      newErrors.taxNumber = "Tax number must be 10–13 digits.";
    }

    if (!formData.identityNumber.trim()) {
      newErrors.identityNumber = "Identity number is required.";
    } else if (!regex.identityNumber.test(formData.identityNumber)) {
      newErrors.identityNumber = "Identity number must be 9–12 digits.";
    }

    // Kiểm tra file bắt buộc
    const requiredFiles = ["frontOfIdentity", "backOfIdentity", "businessLicense", "selfie", "storePolicy"];
    requiredFiles.forEach((f) => {
      if (!formData[f]) {
        newErrors[f] = "Please upload this file.";
      }
    });

    // Kiểm tra policy
    if (!agreePolicy) {
      newErrors.policy = "You must agree to the terms.";
    }

    setErrors(newErrors); // Cập nhật state lỗi
    return newErrors; // Trả về object lỗi
  };

  // handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setShowLoadingMessage(false);

    const formErrors = validateForm(); // Validate lại trước khi gửi
    if (Object.keys(formErrors).length > 0) {
      // Tìm phần tử lỗi đầu tiên và focus vào đó (nếu là input text)
      const firstErrorField = Object.keys(formErrors)[0];
      const firstErrorElement = document.getElementById(firstErrorField);
      if (firstErrorElement && typeof firstErrorElement.focus === 'function') {
        firstErrorElement.focus();
      }
      // Thông báo chung thay vì liệt kê từng lỗi
      alert("Please correct the errors marked in red before submitting.");
      return;
    }

    setIsLoading(true);
    setShowLoadingMessage(true);
    try {
      const formBody = new FormData();
      formBody.append("storeName", formData.storeName);
      formBody.append("taxNumber", formData.taxNumber);
      formBody.append("identityNumber", formData.identityNumber);
      // Đảm bảo tên key khớp với backend
      formBody.append("front of identity", formData.frontOfIdentity);
      formBody.append("back of identity", formData.backOfIdentity);
      formBody.append("business license", formData.businessLicense);
      formBody.append("store policy", formData.storePolicy);
      formBody.append("selfie", formData.selfie);

      await profileApi.verifyKyc(formBody); // Gọi API

      setShowLoadingMessage(false); // Ẩn loading message
      alert("KYC verification submitted successfully!"); // Thông báo thành công
      handleReset(); // Reset form
    } catch (error) {
      console.error("KYC Error:", error);
      setShowLoadingMessage(false); // Ẩn loading message
      alert(error.message || "Failed to submit KYC verification."); // Thông báo lỗi

      // Hiển thị lỗi validation từ server (nếu có cấu trúc `{ error: { field: message } }`)
      if (error.response?.data?.error && typeof error.response.data.error === 'object') {
        setErrors(error.response.data.error);
      }
    } finally {
      setIsLoading(false); // Luôn tắt trạng thái loading của nút
    }
  };

  // handleReset
  const handleReset = () => {
    setFormData({
      storeName: "", taxNumber: "", identityNumber: "",
      frontOfIdentity: null, backOfIdentity: null, businessLicense: null,
      selfie: null, storePolicy: null,
    });
    setUploadedFiles({
      frontOfIdentity: null, backOfIdentity: null, businessLicense: null,
      selfie: null, storePolicy: null,
    });
    setAgreePolicy(false);
    setErrors({});
    setIsLoading(false); // Tắt loading nút
    setShowLoadingMessage(false); // Tắt thông báo loading
  };

  // 🔹 Render có điều kiện (Giữ nguyên)

  // Hiển thị loading khi check profile
  if (checkingProfile) {
    return (
      <div className="upgrade-container">
        <p className="form-message loading">Đang kiểm tra thông tin hồ sơ...</p>
      </div>
    );
  }

  // Hiển thị thông báo nếu profile chưa đủ
  if (!isProfileComplete) {
    return (
      <div className="upgrade-container">
        <div className="upgrade-wrapper profile-incomplete-notice">
          <p className="form-message error">
            Bạn chưa hoàn thành thông tin cá nhân.
          </p>
          <p className="form-message">
            Vui lòng quay về trang thông tin cá nhân để tiếp tục điền thông tin.
          </p>
          <div className="form-buttons">
            <button
              type="button"
              className="btn btn-submit"
              onClick={onGoToProfile}
            >
              Nộp đơn
            </button>

          </div>
        </div>
      </div>
    );
  }

  // --- Render form nâng cấp nếu profile OK ---
  return (
    <div className="upgrade-container">
      <div className="upgrade-wrapper">
        <h1 className="upgrade-title">Trở thành người bán</h1>

        {/* Hiển thị thông báo loading khi gửi form */}
        {showLoadingMessage && (
          <p className="form-message loading">
            Hệ thống đang xác thực thông tin của bạn. Quá trình này có thể mất
            vài giây, vui lòng không rời khỏi trang.
          </p>
        )}

        <form onSubmit={handleSubmit} className="upgrade-form" noValidate>
          {/* Store Name */}
          <div className="form-group">
            <label htmlFor="storeName" className="form-label">Store name *</label>
            <input
              id="storeName"
              name="storeName"
              value={formData.storeName}
              onChange={handleInputChange}
              className={`form-input ${errors.storeName ? "input-error" : ""}`}
              aria-invalid={!!errors.storeName} // Thêm thuộc tính ARIA
              aria-describedby={errors.storeName ? "storeName-error" : undefined}
            />
            {errors.storeName && <p id="storeName-error" className="error-text">{errors.storeName}</p>}
          </div>

          {/* Tax Number */}
          <div className="form-group">
            <label htmlFor="taxNumber" className="form-label">Tax number *</label>
            <input
              id="taxNumber"
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleInputChange}
              className={`form-input ${errors.taxNumber ? "input-error" : ""}`}
              aria-invalid={!!errors.taxNumber}
              aria-describedby={errors.taxNumber ? "taxNumber-error" : undefined}
            />
            {errors.taxNumber && <p id="taxNumber-error" className="error-text">{errors.taxNumber}</p>}
          </div>

          {/* Identity Number */}
          <div className="form-group">
            <label htmlFor="identityNumber" className="form-label">Identity number *</label>
            <input
              id="identityNumber"
              name="identityNumber"
              value={formData.identityNumber}
              onChange={handleInputChange}
              className={`form-input ${errors.identityNumber ? "input-error" : ""}`}
              aria-invalid={!!errors.identityNumber}
              aria-describedby={errors.identityNumber ? "identityNumber-error" : undefined}
            />
            {errors.identityNumber && (
              <p id="identityNumber-error" className="error-text">{errors.identityNumber}</p>
            )}
          </div>

          <p className="upload-note">Upload 1 supported file: PDF or image.</p>

          {/* File Inputs */}
          {[
            ["frontOfIdentity", "Front of identity image *"],
            ["backOfIdentity", "Back of identity image *"],
            ["businessLicense", "Business license *"],
            ["selfie", "Selfie (portrait picture) *"],
            ["storePolicy", "Store policy *"],
          ].map(([key, label]) => (
            <div className="file-upload-item" key={key}>
              <label className="file-label">{label}</label>
              <div className={`file-upload-box ${errors[key] ? 'input-error' : ''}`}>
                <input
                  type="file"
                  id={key}
                  name={key}
                  onChange={(e) => handleFileUpload(e, key)}
                  className="file-input"
                  accept=".pdf,.jpg,.jpeg,.png"
                  disabled={isLoading}
                  aria-invalid={!!errors[key]}
                  aria-describedby={errors[key] ? `${key}-error` : undefined}
                />
                <label htmlFor={key} className={`file-button ${isLoading ? 'disabled' : ''}`}>
                  ⬇ Add file
                </label>
              </div>
              {uploadedFiles[key] && <p className="file-name">{uploadedFiles[key]}</p>}
              {errors[key] && <p id={`${key}-error`} className="error-text">{errors[key]}</p>}
            </div>
          ))}

          {/* Policy Agreement */}
          <div className={`policy-agreement ${errors.policy ? 'input-error' : ''}`}>
            <input
              type="checkbox"
              id="agreePolicy"
              checked={agreePolicy}
              onChange={(e) => {
                setAgreePolicy(e.target.checked);
                if (e.target.checked && errors.policy) {
                  setErrors(prev => ({ ...prev, policy: null }));
                }
              }}
              className="checkbox-input"
              disabled={isLoading}
              aria-invalid={!!errors.policy}
              aria-describedby={errors.policy ? "policy-error" : undefined}
            />
            <label htmlFor="agreePolicy" className="agreement-text">
              I agree to the terms and policies. *
              <button
                type="button"
                className="policy-link"
                onClick={() => !isLoading && setShowPolicyModal(true)}
                disabled={isLoading}
              >
                Chính sách
              </button>
            </label>
          </div>
          {errors.policy && <p id="policy-error" className="error-text" style={{ marginTop: '8px' }}>{errors.policy}</p>}

          {/* Buttons */}
          <div className="form-buttons">
            <button
              type="submit"
              className="btn btn-submit"
              disabled={isLoading}
            >
              {isLoading ? "Đang gửi..." : "Submit"}
            </button>
            <button
              type="button"
              className="btn btn-reset"
              onClick={handleReset}
              disabled={isLoading}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>

      {/* Policy Modal */}
      {showPolicyModal && <PolicyModal onClose={() => setShowPolicyModal(false)} />}
    </div>
  );
}