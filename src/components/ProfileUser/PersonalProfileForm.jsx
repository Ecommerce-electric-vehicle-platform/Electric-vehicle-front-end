import { useState, useEffect } from "react";
import profileApi from "../../api/profileApi";
import { useAddressLoading } from "./hooks/useAddressLoading";
import "./PersonalProfileForm.css";

// --- TIỆN ÍCH ---
const transformOptions = (data) => {
  if (!data) return [];
  return Object.keys(data).map((id) => ({
    value: id,
    label: data[id],
  }));
};

// --- HÀM FORMAT NGÀY ---
const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString || !dateString.includes("-")) return dateString;
  const parts = dateString.split("-");
  if (parts[0].length === 4) {
    const [year, month, day] = parts;
    const cleanDay = day.split("T")[0];
    return `${cleanDay}-${month}-${year}`;
  }
  return dateString;
};

// --- HÀM VALIDATION ---
const validateField = (name, value) => {
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
    case "street":
      if (!value.trim()) return "Vui lòng nhập địa chỉ chi tiết (số nhà, đường).";
      if (!addressRegex.test(value)) return "Địa chỉ chứa ký tự không hợp lệ.";
      break;
    case "dob":
      if (!value.trim()) return "Vui lòng chọn ngày sinh.";
      break;
    case "provinceId":
      if (!value) return "Vui lòng chọn Tỉnh/Thành phố.";
      break;
    case "districtId":
      if (!value) return "Vui lòng chọn Quận/Huyện.";
      break;
    case "wardId":
      if (!value) return "Vui lòng chọn Phường/Xã.";
      break;
    default:
      break;
  }
  return null;
};

// (debounced helper removed - not used after moving address logic to hooks)


export default function PersonalProfileForm() {
  // === STATE ===
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    gender: "male",
    dob: "",
    street: "",
    provinceName: "",
    districtName: "",
    wardName: "",
  });

  const [existingAvatarUrl, setExistingAvatarUrl] = useState(null);
  const [newAvatarFile, setNewAvatarFile] = useState(null);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [provinces, setProvinces] = useState([]);

  const { districts, wards, isLoadingDistricts, isLoadingWards }
    = useAddressLoading(selectedProvince, selectedDistrict);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);

  // === useEffect (Load data) ===
  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");

    const fetchProfile = async () => {
      try {
        const [profileResponse, provincesResponse] = await Promise.all([
          profileApi.getProfile(),
          profileApi.getAddressProvinces()
        ]);

        setProvinces(transformOptions(provincesResponse.data.data));

        const responseBody = profileResponse.data;
        if (!responseBody.success) throw new Error(responseBody.message);

        const profileData = responseBody.data;
        if (!profileData || !profileData.fullName) throw new Error("Profile not completed.");

        // USER ĐÃ CÓ PROFILE
        setFormData({
          fullName: profileData.fullName || "",
          phoneNumber: profileData.phoneNumber || "",
          email: profileData.email || storedEmail || "",
          gender: profileData.gender?.toLowerCase() || "male",
          dob: profileData.dob || "",
          street: profileData.street || "",
          provinceName: profileData.provinceName || "",
          districtName: profileData.districtName || "",
          wardName: profileData.wardName || "",
        });

        setSelectedProvince(profileData.provinceId || "");
        setSelectedDistrict(profileData.districtId || "");
        setSelectedWard(profileData.wardId || "");

        if (profileData.avatarUrl) {
          setExistingAvatarUrl(profileData.avatarUrl);
          localStorage.setItem("buyerAvatar", profileData.avatarUrl);
          // Notify interested components without using the global "storage" event
          window.dispatchEvent(new CustomEvent("buyerAvatarChanged", { detail: { avatarUrl: profileData.avatarUrl } }));
        }


        setIsNewUser(false);
        setIsViewMode(true); // <<< Chuyển sang "Chế độ Xem"

      } catch (error) {
        // USER MỚI hoặc lỗi khi lấy profile
        console.error("Loading profile failed (maybe new user):", error.message);
        try {
          const provincesResponse = await profileApi.getAddressProvinces();
          setProvinces(transformOptions(provincesResponse.data.data));
        } catch (provError) {
          console.error("Failed to load provinces:", provError);
        }

        setIsNewUser(true);
        setIsViewMode(false); // <<< Ở lại "Chế độ Form"
        setFormData((prev) => ({ ...prev, email: storedEmail || "" }));
      }
    };

    fetchProfile();
  }, []); // Chỉ chạy 1 lần
  // Address loading logic moved to `useAddressLoading` hook above.
  // The districts/wards are provided by the hook: `districts`, `wards`,
  // and loading flags `isLoadingDistricts`, `isLoadingWards`.


  // === HANDLERS (Input, Blur, Avatar) ===
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleProvinceChange = (e) => {
    const newProvinceId = e.target.value;
    setSelectedProvince(newProvinceId);
    setSelectedDistrict("");
    setSelectedWard("");
    handleBlur({ target: { name: "provinceId", value: newProvinceId } });
  };

  const handleDistrictChange = (e) => {
    const newDistrictId = e.target.value;
    setSelectedDistrict(newDistrictId);
    setSelectedWard("");
    handleBlur({ target: { name: "districtId", value: newDistrictId } });
  };

  const handleWardChange = (e) => {
    const newWardId = e.target.value;
    setSelectedWard(newWardId);
    handleBlur({ target: { name: "wardId", value: newWardId } });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke previous preview if it was a blob URL we created
      try {
        if (newAvatarFile && existingAvatarUrl && existingAvatarUrl.startsWith("blob:")) {
          URL.revokeObjectURL(existingAvatarUrl);
        }
      } catch {
        // ignore
      }
      setNewAvatarFile(file);
      const preview = URL.createObjectURL(file);
      setExistingAvatarUrl(preview);
      if (errors.avatarUrl) setErrors((prev) => ({ ...prev, "avatarUrl": "" }));
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      try {
        if (existingAvatarUrl && existingAvatarUrl.startsWith("blob:")) {
          URL.revokeObjectURL(existingAvatarUrl);
        }
      } catch {
        // ignore
      }
    };
  }, [existingAvatarUrl]);

  // === handleSubmit ===
  // === handleSubmit (ĐÃ SỬA LỖI AVATAR) ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    // B1: Validation (Giữ nguyên)
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      if (key.endsWith("Name")) return;
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    const provError = validateField("provinceId", selectedProvince);
    if (provError) newErrors.provinceId = provError;
    const distError = validateField("districtId", selectedDistrict);
    if (distError) newErrors.districtId = distError;
    const wardError = validateField("wardId", selectedWard);
    if (wardError) newErrors.wardId = wardError;
    if (isNewUser && !newAvatarFile && !existingAvatarUrl) {
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
      // (Gửi các trường text)
      formBody.append("fullName", formData.fullName);
      formBody.append("phoneNumber", formData.phoneNumber);
      formBody.append("street", formData.street);
      formBody.append("gender", formData.gender.toUpperCase());
      formBody.append("dob", formData.dob);
      formBody.append("email", formData.email);

      // (Gửi 6 trường địa chỉ)
      formBody.append("provinceId", selectedProvince);
      formBody.append("districtId", selectedDistrict);
      formBody.append("wardId", selectedWard);
      const provinceName = provinces.find(p => p.value === selectedProvince)?.label || "";
      const districtName = districts.find(d => d.value === selectedDistrict)?.label || "";
      const wardName = wards.find(w => w.value === selectedWard)?.label || "";
      formBody.append("provinceName", provinceName);
      formBody.append("districtName", districtName);
      formBody.append("wardName", wardName);

      if (newAvatarFile) { // Chỉ gửi file nếu user chọn file MỚI
        formBody.append("avatar_url", newAvatarFile);
      }

      let response;
      if (isNewUser) {
        response = await profileApi.uploadProfile(formBody);
      } else {
        response = await profileApi.updateProfile(formBody);
      }

      const responseBody = response.data;
      if (!responseBody.success) throw new Error(responseBody.message);

      const savedData = responseBody.data || {};
      alert("Lưu hồ sơ thành công!");

      // 🔹 === LOGIC SỬA LỖI AVATAR === 🔹
      const newServerUrl = savedData.avatarUrl; // Lấy URL MỚI từ API

      if (newServerUrl) {
        // Tốt! API đã trả về URL mới. Dùng nó.
        localStorage.setItem("buyerAvatar", newServerUrl);
        setExistingAvatarUrl(newServerUrl); // Cập nhật preview bằng URL thật
      } else if (newAvatarFile) {
        // User có upload file mới, nhưng API không trả về URL mới.
        // Chúng ta KHÔNG lưu "existingAvatarUrl" (đang là blob:) vào localStorage.
        // Sidebar sẽ không cập nhật ngay, nhưng sẽ đúng sau khi F5 (vì getProfile sẽ có)
        //commoent
        console.warn("API không trả về avatarUrl mới sau khi upload.");
      } else {
        // User không đổi ảnh. "existingAvatarUrl" đang là URL cũ.
        // Cứ lưu lại cho chắc.
        localStorage.setItem("buyerAvatar", existingAvatarUrl);
      }
      // Bắn event cho sidebar (custom)
      window.dispatchEvent(new CustomEvent("buyerAvatarChanged", { detail: { avatarUrl: newServerUrl || existingAvatarUrl } }));
      // 🔹 === KẾT THÚC SỬA LỖI === 🔹


      // Cập nhật State (cho View Mode)
      setFormData({
        fullName: savedData.fullName || formData.fullName,
        phoneNumber: savedData.phoneNumber || formData.phoneNumber,
        email: savedData.email || formData.email,
        gender: (savedData.gender || formData.gender).toLowerCase(),
        dob: (savedData.dob || formData.dob).split("T")[0],
        street: savedData.street || formData.street,
        provinceName: provinceName,
        districtName: districtName,
        wardName: wardName,
      });

      setNewAvatarFile(null); // Xóa file đã chọn
      setIsNewUser(false);
      setIsViewMode(true); // Chuyển về "Chế độ Xem"
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors || {});
      } else {
        alert(error.response?.data?.message || error.message || "Không thể lưu hồ sơ.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------
  // === RENDER (View Mode) ===
  // -----------------------------
  if (isViewMode) {
    const fullAddress = [
      formData.street,
      formData.wardName,
      formData.districtName,
      formData.provinceName
    ].filter(Boolean).join(", ");

    return (
      <div className="profile-view-container">
        <h2 className="form-title">Personal profile</h2>
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
          <strong>Địa chỉ:</strong> {fullAddress || "Chưa cập nhật"}
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

  // ----------------------------------------------------
  // === RENDER (Form Mode / Edit Mode) - ĐÃ ĐỔI THỨ TỰ ===
  // ----------------------------------------------------
  return (
    <div className="profile-form-container">
      <h2 className="form-title">
        {isNewUser ? "Hoàn tất hồ sơ" : "Chỉnh sửa hồ sơ"}
      </h2>
      <form onSubmit={handleSubmit} className="profile-form">

        {/* 🔹 AVATAR (ĐÃ CHUYỂN LÊN TRÊN) 🔹 */}
        <div className="form-field avatar-field-center">
          <label htmlFor="avatarUrl" className="form-label">Ảnh đại diện*</label>
          {existingAvatarUrl && (
            <img src={existingAvatarUrl} alt="Avatar Preview" className="avatar-preview" />
          )}
          <div className="input-wrapper">
            <input
              id="avatarUrl" type="file" accept="image/*"
              onChange={handleAvatarChange}
              onBlur={handleBlur}
              name="avatarUrl"
              className={`form-input ${errors.avatarUrl ? "input-error" : ""}`}
            />
            {errors.avatarUrl && <span className="error-text">{errors.avatarUrl}</span>}
          </div>
        </div>

        {/* 🔹 FULL NAME (Nằm sau Avatar) 🔹 */}
        <div className="form-field">
          <label htmlFor="fullName" className="form-label">Full name*</label>
          <div className="input-wrapper">
            <input
              id="fullName" name="fullName" type="text"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${errors.fullName ? "input-error" : ""}`}
            />
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>
        </div>

        {/* Phone number */}
        <div className="form-field">
          <label htmlFor="phoneNumber" className="form-label">Phone number*</label>
          <div className="input-wrapper">
            <input
              id="phoneNumber" name="phoneNumber" type="tel"
              value={formData.phoneNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${errors.phoneNumber ? "input-error" : ""}`}
            />
            {errors.phoneNumber && <span className="error-text">{errors.phoneNumber}</span>}
          </div>
        </div>

        {/* Email */}
        <div className="form-field">
          <label htmlFor="email" className="form-label">Email*</label>
          <div className="input-wrapper">
            <input
              id="email" name="email" type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${errors.email ? "input-error" : ""}`}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
        </div>

        {/* Gender */}
        <div className="form-field">
          <label className="form-label">Gender*</label>
          <div className="radio-group">
            <label className="radio-label">
              <input type="radio" name="gender" value="male"
                checked={formData.gender === "male"}
                onChange={handleChange}
              /> <span>Male</span>
            </label>
            <label className="radio-label">
              <input type="radio" name="gender" value="female"
                checked={formData.gender === "female"}
                onChange={handleChange}
              /> <span>Female</span>
            </label>
          </div>
          {errors.gender && <span className="error-text">{errors.gender}</span>}
        </div>

        {/* Birthday */}
        <div className="form-field">
          <label htmlFor="dob" className="form-label">Birthday*</label>
          <div className="input-wrapper">
            <input
              id="dob" name="dob" type="date"
              value={formData.dob}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${errors.dob ? "input-error" : ""}`}
            />
            {errors.dob && <span className="error-text">{errors.dob}</span>}
          </div>
        </div>

        {/* Tỉnh/Thành */}
        <div className="form-field">
          <label htmlFor="provinceId" className="form-label">Tỉnh/Thành phố*</label>
          <div className="input-wrapper">
            <select
              id="provinceId" name="provinceId"
              value={selectedProvince}
              onChange={handleProvinceChange}
              onBlur={handleBlur}
              className={`form-input ${errors.provinceId ? "input-error" : ""}`}
            >
              <option value="">-- Chọn Tỉnh/Thành --</option>
              {provinces.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.provinceId && <span className="error-text">{errors.provinceId}</span>}
          </div>
        </div>

        {/* Quận/Huyện */}
        <div className="form-field">
          <label htmlFor="districtId" className="form-label">Quận/Huyện*</label>
          <div className="input-wrapper">
            <select
              id="districtId" name="districtId"
              value={selectedDistrict}
              onChange={handleDistrictChange}
              onBlur={handleBlur}
              disabled={!selectedProvince || isLoadingDistricts}
              className={`form-input ${errors.districtId ? "input-error" : ""}`}
            >
              <option value="">
                {isLoadingDistricts ? "Đang tải huyện..." : "-- Chọn Quận/Huyện --"}
              </option>
              {districts.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.districtId && <span className="error-text">{errors.districtId}</span>}
          </div>
        </div>

        {/* Phường/Xã */}
        <div className="form-field">
          <label htmlFor="wardId" className="form-label">Phường/Xã*</label>
          <div className="input-wrapper">
            <select
              id="wardId" name="wardId"
              value={selectedWard}
              onChange={handleWardChange}
              onBlur={handleBlur}
              disabled={!selectedDistrict || isLoadingWards}
              className={`form-input ${errors.wardId ? "input-error" : ""}`}
            >
              <option value="">
                {isLoadingWards ? "Đang tải xã..." : "-- Chọn Phường/Xã --"}
              </option>
              {wards.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.wardId && <span className="error-text">{errors.wardId}</span>}
          </div>
        </div>

        {/* Địa chỉ chi tiết (Số nhà, đường) */}
        <div className="form-field">
          <label htmlFor="street" className="form-label">
            Địa chỉ chi tiết (Số nhà, đường)*
          </label>
          <div className="input-wrapper">
            <input
              id="street"
              name="street"
              type="text"
              placeholder="Ví dụ: 7 Đ. D1, Long Thạnh Mỹ, Thủ Đức"
              value={formData.street}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`form-input ${errors.street ? "input-error" : ""}`}
            />
            {errors.street && (
              <span className="error-text">{errors.street}</span>
            )}
          </div>
        </div>

        {/* Submit button */}
        <div className="form-submit">
          <button
            type="submit"
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? "Đang lưu..." : (isNewUser ? "Hoàn tất" : "Save Change")}
          </button>
        </div>
      </form>
    </div>
  );
}