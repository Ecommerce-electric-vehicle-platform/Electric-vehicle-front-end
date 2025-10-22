// src/components/PersonalProfileForm/PersonalProfileForm.js
import { useState, useEffect } from "react";
import profileApi from "../../api/profileApi";
import "./PersonalProfileForm.css";

// 🔹 Hàm này vẫn cần để hiển thị ngày ở "Chế độ Xem"
const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString || !dateString.includes("-")) return dateString; // Guard
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};

// 🔹 --- HÀM VALIDATION MỚI --- 🔹
// Chứa logic validation giống hệt file UpdateBuyerProfileRequest.java
const validateField = (name, value) => {
  // Định nghĩa Regex (lấy từ file Java)
  // Thêm 'u' cho regex để hỗ trợ Unicode (\p{L})
  const nameRegex = /^[\p{L}\s]+$/u;
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;
  const phoneRegex = /^0\d{9}$/;
  const addressRegex = /^[\p{L}0-9\s,./-]+$/u;

  switch (name) {
    case "fullName":
      if (!value.trim()) return "Vui lòng nhập họ và tên.";
      if (!nameRegex.test(value)) return "Họ tên chỉ được chứa chữ cái và khoảng trắng.";
      break;
    case "phoneNumber":
      if (!value.trim()) return "Vui lòng nhập số điện thoại.";
      if (!phoneRegex.test(value)) return "SĐT phải bắt đầu bằng 0 và đủ 10 số.";
      break;
    case "email":
      if (!value.trim()) return "Email là bắt buộc.";
      if (!emailRegex.test(value)) return "Định dạng email không hợp lệ.";
      break;
    case "defaultShippingAddress":
      if (!value.trim()) return "Vui lòng nhập địa chỉ giao hàng.";
      if (!addressRegex.test(value)) return "Địa chỉ chứa ký tự không hợp lệ.";
      break;
    case "dob":
      if (!value.trim()) return "Vui lòng chọn ngày sinh.";
      break;
    default:
      break;
  }
  return null; // Không có lỗi
};
// 🔹 -------------------------- 🔹


export default function PersonalProfileForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    gender: "male",
    dob: "",
    defaultShippingAddress: "",
  });

  // (Các state khác giữ nguyên)
  const [existingAvatarUrl, setExistingAvatarUrl] = useState(null);
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);

  // 🔹 useEffect (Load data) - ĐÃ SỬA LẠI (theo yêu cầu) 🔹
  // src/components/PersonalProfileForm/PersonalProfileForm.js

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");

    const fetchProfile = async () => {
      try {
        const response = await profileApi.getProfile();

        // 🔹 SỬA LẠI CÁCH BÓC TÁCH DATA 🔹
        const responseBody = response.data; // Đây là { success: true, data: {...}, ... }

        // Kiểm tra xem API có success không
        if (!responseBody.success) {
          throw new Error(responseBody.message || "Lỗi khi tải profile.");
        }

        // Lấy data profile thật (lớp bên trong)
        const profileData = responseBody.data;

        // 🔹 KIỂM TRA "THÔNG MINH" (dùng profileData) 🔹
        if (!profileData || !profileData.fullName) {
          throw new Error("Profile is not completed.");
        }
        // 🔹 KẾT THÚC SỬA 🔹

        // User đã có profile (dùng profileData)
        setFormData({
          fullName: profileData.fullName || "",
          phoneNumber: profileData.phoneNumber || "",
          email: profileData.email || storedEmail || "",
          gender: profileData.gender?.toLowerCase() || "male",
          dob: profileData.dob || "",
          defaultShippingAddress: profileData.defaultShippingAddress || "",
        });

        if (profileData.avatarUrl) { // 🔹 Sửa: dùng profileData.avatarUrl
          setExistingAvatarUrl(profileData.avatarUrl);
          localStorage.setItem("buyerAvatar", profileData.avatarUrl);
        }

        setIsNewUser(false);
        setIsViewMode(true); // 🔹 Sẽ chạy đúng

      } catch (error) {
        // Lỗi 404/500 hoặc profile chưa hoàn tất
        console.error("Không thể tải hồ sơ (có thể là user mới):", error.message);
        setIsNewUser(true);
        setIsViewMode(false); // 🔹 Hiển thị FORM
        setFormData((prev) => ({
          ...prev,
          email: storedEmail || "",
        }));
      }
    };

    fetchProfile();
  }, []);

  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 🔹 Xóa lỗi ngay khi người dùng gõ lại 🔹
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // 🔹 --- HÀM MỚI: XỬ LÝ VALIDATE KHI BLUR --- 🔹
  const handleBlur = (e) => {
    const { name, value } = e.target;
    // (Đã xóa dòng if name === 'email' return)
    const error = validateField(name, value);
    setErrors((prev) => ({
      ...prev,
      [name]: error, // Set lỗi (hoặc null nếu hợp lệ)
    }));
  };
  // 🔹 --------------------------------------- 🔹

  // Xử lý chọn file (Giữ nguyên)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAvatarFile(file);
      setExistingAvatarUrl(URL.createObjectURL(file));
      if (errors.avatarUrl) setErrors((prev) => ({ ...prev, "avatarUrl": "" }));
    }
  };

  // 🔹 handleSubmit - ĐÃ SỬA LẠI (theo yêu cầu) 🔹
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    // B1: Check validation (dùng lại hàm validateField)
    const newErrors = {};
    // Kiểm tra tất cả các trường trong formData
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    // Kiểm tra avatar (nếu là user mới)
    if (isNewUser && !newAvatarFile) {
      newErrors.avatarUrl = "Vui lòng chọn ảnh đại diện.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Vui lòng điền đầy đủ và chính xác các thông tin.");
      return;
    }

    // B2: Gửi API
    setIsLoading(true);
    setErrors({});

    try {
      const formBody = new FormData();
      formBody.append("fullName", formData.fullName);
      formBody.append("phoneNumber", formData.phoneNumber);
      formBody.append("defaultShippingAddress", formData.defaultShippingAddress);
      formBody.append("gender", formData.gender.toUpperCase());
      formBody.append("dob", formData.dob);
      formBody.append("email", formData.email); // 🔹 ĐÃ THÊM EMAIL

      if (newAvatarFile) {
        formBody.append("avatar_url", newAvatarFile);
      }

      let response;
      if (isNewUser) {
        response = await profileApi.uploadProfile(formBody);
      } else {
        response = await profileApi.updateProfile(formBody);
      }

      const savedData = response.data;
      alert("Lưu hồ sơ thành công!");

      if (savedData.avatar_url) {
        localStorage.setItem("buyerAvatar", savedData.avatar_url);
        setExistingAvatarUrl(savedData.avatar_url);
      }

      // 🔹 Cập nhật lại state form (đầy đủ các trường) 🔹
      setFormData({
        fullName: savedData.fullName || formData.fullName,
        phoneNumber: savedData.phoneNumber || formData.phoneNumber,
        email: savedData.email || formData.email,
        gender: (savedData.gender || formData.gender).toLowerCase(),
        dob: savedData.dob || formData.dob,
        defaultShippingAddress: savedData.defaultShippingAddress || formData.defaultShippingAddress,
      });

      setNewAvatarFile(null);
      setIsNewUser(false);
      setIsViewMode(true);
    } catch (error) {
      if (error.response?.data?.errors) {
        // Lỗi validation từ server (nếu có)
        setErrors(error.response.data.errors || {});
      } else {
        alert(error.message || "Không thể lưu hồ sơ.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER (Chế độ Xem) ---
  if (isViewMode) {
    return (
      <div className="profile-view-container">
        <h2 className="form-title">Hồ sơ cá nhân</h2>
        <div className="profile-view-avatar">
          <img
            src={existingAvatarUrl || "/default-avatar.png"}
            alt="User avatar"
            className="avatar-image-large"
          />
        </div>
        <div className="view-field">
          <strong>Họ và tên:</strong> {formData.fullName}
        </div>
        <div className="view-field">
          <strong>Email:</strong> {formData.email}
        </div>
        <div className="view-field">
          <strong>Số điện thoại:</strong> {formData.phoneNumber}
        </div>
        <div className="view-field">
          <strong>Giới tính:</strong> {formData.gender === 'male' ? 'Nam' : 'Nữ'}
        </div>
        <div className="view-field">
          <strong>Ngày sinh:</strong> {formatDateToDDMMYYYY(formData.dob)}
        </div>
        <div className="view-field">
          <strong>Địa chỉ:</strong> {formData.defaultShippingAddress}
        </div>
        <div className="form-submit">
          <button
            onClick={() => setIsViewMode(false)}
            className="submit-button"
          >
            Chỉnh sửa thông tin
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER (Chế độ Sửa - Form) ---
  // 🔹 ĐÃ THÊM onBlur VÀO CÁC INPUT 🔹
  return (
    <div className="profile-form-container">
      <h2 className="form-title">
        {isNewUser ? "Hoàn tất hồ sơ" : "Chỉnh sửa hồ sơ"}
      </h2>
      <form onSubmit={handleSubmit} className="profile-form">
        {/* Avatar (Giữ nguyên) */}
        <div className="form-field avatar-field-center">
          <label htmlFor="avatarUrl" className="form-label">
            Ảnh đại diện*
          </label>
          {existingAvatarUrl && (
            <img
              src={existingAvatarUrl}
              alt="Avatar Preview"
              className="avatar-preview"
            />
          )}
          <div className="input-wrapper">
            <input
              id="avatarUrl"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              onBlur={handleBlur} // Thêm onBlur cho avatar
              name="avatarUrl"
              className={`form-input ${errors.avatarUrl ? "input-error" : ""}`}
            />
            {errors.avatarUrl && (
              <span className="error-text">{errors.avatarUrl}</span>
            )}
          </div>
        </div>


        {/* Full name */}
        <div className="form-field">
          <label htmlFor="fullName" className="form-label">
            Họ và tên*
          </label>
          <div className="input-wrapper">
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur} // 🔹 THÊM VÀO
              className={`form-input ${errors.fullName ? "input-error" : ""}`}
            />
            {errors.fullName && (
              <span className="error-text">{errors.fullName}</span>
            )}
          </div>
        </div>

        {/* Phone number */}
        <div className="form-field">
          <label htmlFor="phoneNumber" className="form-label">
            Số điện thoại*
          </label>
          <div className="input-wrapper">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              onBlur={handleBlur} // 🔹 THÊM VÀO
              className={`form-input ${errors.phoneNumber ? "input-error" : ""
                }`}
            />
            {errors.phoneNumber && (
              <span className="error-text">{errors.phoneNumber}</span>
            )}
          </div>
        </div>

        {/* 🔹 Email (ĐÃ CHO SỬA) 🔹 */}
        <div className="form-field">
          <label htmlFor="email" className="form-label">
            Email*
          </label>
          <div className="input-wrapper">
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur} // 🔹 THÊM VÀO
              className={`form-input ${errors.email ? "input-error" : ""}`}
            // (readOnly đã bị xóa)
            />
            {errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>
        </div>

        {/* Gender (Radio, không cần onBlur) */}
        <div className="form-field">
          <label className="form-label">Giới tính*</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === "male"}
                onChange={handleChange}
              />
              <span>Nam</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === "female"}
                onChange={handleChange}
              />
              <span>Nữ</span>
            </label>
          </div>
          {/* Hiển thị lỗi chung cho gender nếu submit */}
          {errors.gender && <span className="error-text">{errors.gender}</span>}
        </div>

        {/* Birthday */}
        <div className="form-field">
          <label htmlFor="dob" className="form-label">
            Ngày sinh*
          </label>
          <div className="input-wrapper">
            <input
              id="dob"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              onBlur={handleBlur} // 🔹 THÊM VÀO
              className={`form-input ${errors.dob ? "input-error" : ""}`}
            />
            {errors.dob && <span className="error-text">{errors.dob}</span>}
          </div>
        </div>

        {/* Address */}
        <div className="form-field">
          <label htmlFor="defaultShippingAddress" className="form-label">
            Địa chỉ*
          </label>
          <div className="input-wrapper">
            <input
              id="defaultShippingAddress"
              name="defaultShippingAddress"
              type="text"
              placeholder="7 Đ. D1, Long Thạnh Mỹ, Thủ Đức, Hồ Chí Minh"
              value={formData.defaultShippingAddress}
              onChange={handleChange}
              onBlur={handleBlur} // 🔹 THÊM VÀO
              className={`form-input ${errors.defaultShippingAddress ? "input-error" : ""
                }`}
            />
            {errors.defaultShippingAddress && (
              <span className="error-text">
                {errors.defaultShippingAddress}
              </span>
            )}
          </div>
        </div>

        {/* Submit button (Giữ nguyên) */}
        <div className="form-submit">
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}