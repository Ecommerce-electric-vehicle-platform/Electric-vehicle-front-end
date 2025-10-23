// src/components/PersonalProfileForm/PersonalProfileForm.js
import { useState, useEffect } from "react";
import profileApi from "../../api/profileApi";
import "./PersonalProfileForm.css";

// (Hàm formatDateToDDMMYYYY... giữ nguyên)
const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString || !dateString.includes("-")) return dateString; // Guard
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
};

// (Hàm validateField... giữ nguyên)
const validateField = (name, value) => {
  const nameRegex = /^[\p{L}\s]+$/u;
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;
  const phoneRegex = /^0\d{9}$/;
  const addressRegex = /^[\p{L}0-9\s,./-]+$/u;

  switch (name) {
    case "fullName":
      if (!value?.trim()) return "Vui lòng nhập họ và tên."; // Thêm ?. an toàn
      if (!nameRegex.test(value)) return "Họ tên chỉ được chứa chữ cái và khoảng trắng.";
      break;
    case "phoneNumber":
      if (!value?.trim()) return "Vui lòng nhập số điện thoại.";
      if (!phoneRegex.test(value)) return "SĐT phải bắt đầu bằng 0 và đủ 10 số.";
      break;
    case "email":
      if (!value?.trim()) return "Email là bắt buộc.";
      if (!emailRegex.test(value)) return "Định dạng email không hợp lệ.";
      break;
    case "defaultShippingAddress":
      if (!value?.trim()) return "Vui lòng nhập địa chỉ giao hàng.";
      if (!addressRegex.test(value)) return "Địa chỉ chứa ký tự không hợp lệ.";
      break;
    case "dob":
      if (!value?.trim()) return "Vui lòng chọn ngày sinh.";
      break;
    default:
      break;
  }
  return null; // Không có lỗi
};


export default function PersonalProfileForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    gender: "male",
    dob: "",
    defaultShippingAddress: "",
  });

  // 🔹 STATE MỚI: Dùng để lưu bản gốc khi bấm "Cancel"
  const [pristineData, setPristineData] = useState(null);

  const [existingAvatarUrl, setExistingAvatarUrl] = useState(null);
  const [newAvatarFile, setNewAvatarFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false); // Khởi tạo là false
  const [isNewUser, setIsNewUser] = useState(true);

  // 🔹 1. Đọc email từ storage MỘT LẦN khi component render (để dùng làm dependency)
  const storedEmail = localStorage.getItem("userEmail");

  // 🔹 2. Sửa lại HOÀN TOÀN useEffect (FIX LỖI USER MỚI)
  useEffect(() => {
    
    // Đọc email "mới nhất" ngay khi effect chạy
    const currentEmail = localStorage.getItem("userEmail");

    const fetchProfile = async () => {
      // Bắt đầu thì reset lỗi cũ (nếu có)
      setErrors({});
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

        // Kiểm tra "thông minh" (coi fullName rỗng là chưa có profile)
        if (!profileData || !profileData.fullName || profileData.fullName.trim() === "") { 
          throw new Error("Profile is not completed.");
        }

        // User đã có profile (dùng profileData)
        const mappedData = {
          fullName: profileData.fullName || "",
          phoneNumber: profileData.phoneNumber || "",
          email: profileData.email || currentEmail || "", // Dùng email mới nhất
          gender: profileData.gender?.toLowerCase() || "male",
          dob: profileData.dob || "",
          defaultShippingAddress: profileData.defaultShippingAddress || "",
          avatarUrl: profileData.avatarUrl || null // Thêm avatarUrl
        };

        setFormData(mappedData); // Set data cho form
        setPristineData(mappedData); // Set data backup

        if (profileData.avatarUrl) {
          setExistingAvatarUrl(profileData.avatarUrl);
          // Không cần set localStorage ở đây nữa, vì Sidebar tự đọc
          // localStorage.setItem("buyerAvatar", profileData.avatarUrl); 
        } else {
          setExistingAvatarUrl(null); // Đảm bảo avatar default nếu API ko trả về
        }

        setIsNewUser(false);
        setIsViewMode(true); // Chuyển sang View

      } catch (error) {
        // Lỗi 404/500 hoặc profile chưa hoàn tất
        console.error("Không thể tải hồ sơ (có thể là user mới):", error.message);
        
        // 🔹 RESET LẠI STATE KHI USER MỚI KHÔNG CÓ DATA 🔹
        setIsNewUser(true);
        setIsViewMode(false); // Hiển thị Form
        setExistingAvatarUrl(null); // 🔹 Reset avatar về default
        setPristineData(null); // 🔹 Xóa data backup cũ
        
        setFormData({ // 🔹 Reset form về rỗng (chỉ giữ lại email)
            fullName: "",
            phoneNumber: "",
            email: currentEmail || "", // Dùng email mới nhất
            gender: "male",
            dob: "",
            defaultShippingAddress: "",
        });
      }
    };

    // Chỉ fetch profile nếu user đã đăng nhập (có email)
    if (currentEmail) {
        fetchProfile();
    } else {
        // User ĐÃ LOGOUT, reset mọi thứ (phòng trường hợp logout mà component chưa unmount)
        setIsNewUser(true);
        setIsViewMode(false);
        setFormData({ email: "", fullName: "", phoneNumber: "", gender: "male", dob: "", defaultShippingAddress: "" });
        setPristineData(null);
        setExistingAvatarUrl(null);
        setNewAvatarFile(null);
        setErrors({});
    }
    
  // 🔹 3. THAY ĐỔI DEPENDENCY: Chạy lại effect này khi `storedEmail` thay đổi
  }, [storedEmail]);


  // (handleChange, handleBlur, handleAvatarChange... giữ nguyên)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error, }));
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewAvatarFile(file);
      setExistingAvatarUrl(URL.createObjectURL(file)); // Tạo preview
      if (errors.avatarUrl) setErrors((prev) => ({ ...prev, "avatarUrl": "" }));
    } else {
      // Nếu user bấm cancel khi chọn file
      setNewAvatarFile(null);
      // Khôi phục ảnh preview về ảnh cũ (nếu có) hoặc null
      setExistingAvatarUrl(pristineData?.avatarUrl || null); 
    }
  };


  // 🔹 HÀM MỚI: XỬ LÝ NÚT CANCEL 🔹
  const handleCancel = () => {
    if (!pristineData) return; // Không có data gốc thì không làm gì
    setFormData(pristineData); // 1. Khôi phục data gốc
    setErrors({}); // 2. Xóa hết lỗi
    setNewAvatarFile(null); // 3. Hủy file ảnh đã chọn
    setExistingAvatarUrl(pristineData.avatarUrl || null); // 4. Khôi phục ảnh preview gốc
    setIsViewMode(true); // 5. Quay về chế độ View
  };


  // 🔹 handleSubmit (ĐÃ RÚT GỌN - Giả sử backend dùng dob/avatar_url) 🔹
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    // (Validation... giữ nguyên)
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      // Bỏ qua avatarUrl khi validate form data thường
      if (key !== 'avatarUrl') { 
        const error = validateField(key, formData[key]);
        if (error) { newErrors[key] = error; }
      }
    });
    // Kiểm tra avatar riêng
    if (isNewUser && !newAvatarFile && !existingAvatarUrl) {
      newErrors.avatarUrl = "Vui lòng chọn ảnh đại diện.";
    } else if (!isNewUser && !newAvatarFile && !existingAvatarUrl) {
       // Nếu đang edit mà xóa ảnh cũ đi (hiếm khi xảy ra)
       // Tùy logic bạn muốn: bắt buộc hay cho phép null avatarUrl
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Vui lòng điền đầy đủ và chính xác các thông tin.");
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const formBody = new FormData();
      formBody.append("fullName", formData.fullName);
      formBody.append("phoneNumber", formData.phoneNumber);
      formBody.append("defaultShippingAddress", formData.defaultShippingAddress);
      formBody.append("gender", formData.gender.toUpperCase());
      formBody.append("email", formData.email);
      formBody.append("dob", formData.dob); 

      if (newAvatarFile) {
        formBody.append("avatar_url", newAvatarFile);
      }
      
      let response;
      if (isNewUser) {
        response = await profileApi.uploadProfile(formBody);
      } else {
        response = await profileApi.updateProfile(formBody);
      }

      const responseBody = response.data;
      if (!responseBody.success) {
        throw new Error(responseBody.message || "Lỗi khi lưu profile.");
      }
      const savedData = responseBody.data;

      if (!savedData) {
         throw new Error("Server trả về data rỗng sau khi lưu.");
      }
      
      alert("Lưu hồ sơ thành công!");

      const mappedData = {
          fullName: savedData.fullName || "",
          phoneNumber: savedData.phoneNumber || "",
          email: savedData.email || "",
          gender: (savedData.gender || "male").toLowerCase(),
          dob: savedData.dob || "",
          defaultShippingAddress: savedData.defaultShippingAddress || "",
          avatarUrl: savedData.avatarUrl || null
      };

      setFormData(mappedData);
      setPristineData(mappedData); // Cập nhật backup

      if (savedData.avatarUrl) {
        localStorage.setItem("buyerAvatar", savedData.avatarUrl); // Cập nhật cho Sidebar
        setExistingAvatarUrl(savedData.avatarUrl);
      } else {
         // Nếu API update mà không trả về avatarUrl (ví dụ user xóa avatar)
         localStorage.removeItem("buyerAvatar");
         setExistingAvatarUrl(null);
      }
      
      setNewAvatarFile(null);
      setIsNewUser(false);
      setIsViewMode(true); // Chuyển về View
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.message;
      alert(serverMessage || "Không thể lưu hồ sơ.");
       // Hiển thị lỗi validation từ server (nếu có)
       if (error.response?.data?.error) { // Kiểm tra cấu trúc lỗi mới
            const serverErrors = error.response.data.error;
            if (typeof serverErrors === 'object') {
                 setErrors(serverErrors);
            }
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

        {/* ... address ... */}
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

        {/* 🔹 SỬA LẠI KHỐI SUBMIT + THÊM NÚT CANCEL 🔹 */}
        <div className="form-submit">
          {/* Nút Cancel chỉ hiện khi KHÔNG PHẢI user mới */}
          {!isNewUser && (
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-button" // (Bạn cần thêm CSS cho class này)
            >
              Hủy
            </button>
          )}
          
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