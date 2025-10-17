import { useState, useEffect } from "react";
import profileApi from "../../api/profileApi";
import "./PersonalProfileForm.css";
export default function PersonalProfileForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    gender: "male",
    dob: "",
    defaultShippingAddress: "",
  });
  const [avatarUrl, setAvatarUrl] = useState(null);
  //const [userId, setUserId] = useState(null);
  const [errors, setErrors] = useState({}); // chứa lỗi từ backend
  // Lấy email & userId từ localStorage khi load trang
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    //const storedUserId = localStorage.getItem("buyerId");
    setFormData((prev) => ({
      ...prev,
      email: storedEmail || "",
    }));
    // Nếu có buyerId lưu trong localStorage thì đặt vào state
    // if (storedUserId) {
    //   setUserId(storedUserId);
    // }
  }, []);
  // Xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear lỗi khi user gõ lại
  };
  // Gửi dữ liệu profile lên backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    // B1: Check local validation (frontend)
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Vui lòng nhập họ và tên.";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Vui lòng nhập số điện thoại.";
    if (!formData.defaultShippingAddress.trim())
      newErrors.defaultShippingAddress = "Vui lòng nhập địa chỉ giao hàng.";
    if (!formData.dob.trim()) newErrors.dob = "Vui lòng chọn ngày sinh.";
    if (!formData.gender) newErrors.gender = "Vui lòng chọn giới tính.";
    if (!avatarUrl) newErrors.avatarUrl = "Vui lòng chọn ảnh đại diện.";
    // Nếu có lỗi, hiển thị alert và highlight từng field
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }
    // B2: Gửi API nếu không có lỗi
    try {
      // ensure we have a userId (buyerId). fallback to localStorage if not present in state
      // const effectiveUserId = userId || localStorage.getItem("buyerId");
      // if (!effectiveUserId) {
      //   console.log("Không tìm thấy buyerId. Vui lòng đăng nhập lại.");
      //   return;
      // }
      
      const formBody = new FormData();
      formBody.append("fullName", formData.fullName);
      formBody.append("phoneNumber", formData.phoneNumber);
      formBody.append("defaultShippingAddress", formData.defaultShippingAddress);
      formBody.append("gender", formData.gender.toUpperCase());
      formBody.append("dob", formData.dob);
      formBody.append("avatar_url", avatarUrl);
      
      await profileApi.uploadProfile(formBody);
      alert("Lưu hồ sơ thành công!");
      setErrors({});
    } catch (error) {
      if (error.response?.data?.errors) {
        // lỗi từ backend (validate)
        setErrors(error.response.data.errors || {});
      } else {
        alert(error.response?.data?.message || "Không thể lưu hồ sơ.");
      }
    }
  };
  return (
    <div className="profile-form-container">
      <h2 className="form-title">Personal profile</h2>
      <form onSubmit={handleSubmit} className="profile-form">
        {/* Full name */}
        <div className="form-field">
          <label htmlFor="fullName" className="form-label">
            Full name*
          </label>
          <div className="input-wrapper">
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
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
            Phone number*
          </label>
          <div className="input-wrapper">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              className={`form-input ${errors.phoneNumber ? "input-error" : ""
                }`}
            />
            {errors.phoneNumber && (
              <span className="error-text">{errors.phoneNumber}</span>
            )}
          </div>
        </div>
        {/* Email */}
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
              className={`form-input ${errors.email ? "input-error" : ""}`}
            />
            {errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>
        </div>
        {/* Gender */}
        <div className="form-field">
          <label className="form-label">Gender*</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={formData.gender === "male"}
                onChange={handleChange}
              />
              <span>Male</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={formData.gender === "female"}
                onChange={handleChange}
              />
              <span>Female</span>
            </label>
          </div>
          {errors.gender && <span className="error-text">{errors.gender}</span>}
        </div>
        {/* Birthday */}
        <div className="form-field">
          <label htmlFor="dob" className="form-label">
            Birthday*
          </label>
          <div className="input-wrapper">
            <input
              id="dob"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={handleChange}
              className={`form-input ${errors.dob ? "input-error" : ""}`}
            />
            {errors.dob && <span className="error-text">{errors.dob}</span>}
          </div>
        </div>
        {/* Address */}
        <div className="form-field">
          <label htmlFor="defaultShippingAddress" className="form-label">
            Address*
          </label>
          <div className="input-wrapper">
            <input
              id="defaultShippingAddress"
              name="defaultShippingAddress"
              type="text"
              placeholder="7 Đ. D1, Long Thạnh Mỹ, Thủ Đức, Hồ Chí Minh"
              value={formData.defaultShippingAddress}
              onChange={handleChange}
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
        {/* Avatar */}
        {/* Avatar */}
        <div className="form-field">
          <label htmlFor="avatarUrl" className="form-label">
            Ảnh đại diện*
          </label>
          <div className="input-wrapper">
            <input
              id="avatarUrl"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarUrl(e.target.files[0])}
              className={`form-input ${errors.avatarUrl ? "input-error" : ""}`}
            />
            {errors.avatarUrl && <span className="error-text">{errors.avatarUrl}</span>}
          </div>
        </div>
        <div className="form-submit">
          <button type="submit" className="submit-button">
            Save Change
          </button>
        </div>
      </form>
    </div>
  );
}

