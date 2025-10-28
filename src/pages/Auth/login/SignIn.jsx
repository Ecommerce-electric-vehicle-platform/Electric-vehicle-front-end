import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import authApi from "../../../api/authApi";
import profileApi from "../../../api/profileApi";
// Bỏ import sellerApi vì không cần gọi getSellerProfile nữa
// import sellerApi from "../../../api/sellerApi";
import { GoogleLogin } from "@react-oauth/google";

// Helper function để chuyển đổi role từ backend sang frontend
const mapRole = (backendRole) => {
    // Nếu backend trả về "ROLE_SELLER", chuyển thành "seller"
    if (backendRole === "ROLE_SELLER") {
        return "seller";
    }
    // Mặc định tất cả các trường hợp khác (bao gồm "ROLE_BUYER", null, undefined...) là "buyer"
    return "buyer";
};


export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState("");

  // ===== VALIDATION =====
  const validateField = (name, value) => {
    let message = "";

    if (name === "username") {
      if (!value.trim()) message = "Tên đăng nhập là bắt buộc.";
      else if (!/^[A-Za-z0-9_]+$/.test(value))
        message = "Chỉ được phép dùng chữ, số hoặc dấu gạch dưới.";
      else if (value.length < 4) message = "Tối thiểu 4 ký tự.";
    }

    if (name === "password") {
      if (!value.trim()) message = "Mật khẩu là bắt buộc.";
      else if (/\s/.test(value)) message = "Không được có khoảng trắng.";
      else if (value.length < 8) message = "Tối thiểu 8 ký tự.";
      // Bỏ check ký tự đặc biệt để dễ test, bạn có thể bật lại sau
      // else if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/.test(value))
      //   message = "Phải bao gồm chữ, số và ký tự đặc biệt.";
    }

    setErrors((prev) => ({ ...prev, [name]: message }));
    return message; // Trả về message để validateAll dùng
  };

  const validateAll = () => {
    const newErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      const message = validateField(key, value); // Gọi validate và lấy message
      if (message) newErrors[key] = message; // Chỉ thêm lỗi nếu có message
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value); // Validate ngay khi thay đổi
    setBackendError(""); // Xóa lỗi backend khi người dùng sửa
  };

  // ===== SUBMIT (ĐÃ SỬA LOGIC ROLE) =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Bỏ comment dòng dưới nếu bạn muốn bật lại validation
    // if (!validateAll()) return;

    try {
      // Step 1: Gọi API đăng nhập
      const loginResponse = await authApi.signin(formData);
      const loginData = loginResponse?.data?.data;

      // === KIỂM TRA RESPONSE CÓ ĐỦ THÔNG TIN (TOKEN + ROLE) ===
      if (!loginData?.accessToken || !loginData?.refreshToken || !loginData?.role) {
        console.error("API login response missing token or role:", loginData);
        throw new Error("API login không trả về đủ thông tin (token, role).");
      }

      // Step 2: Lưu token, info cơ bản và ROLE đã xử lý
      localStorage.setItem("accessToken", loginData.accessToken);
      localStorage.setItem("refreshToken", loginData.refreshToken);
      localStorage.setItem("token", loginData.accessToken); // Giữ key cũ nếu cần
      localStorage.setItem("username", loginData.username);
      localStorage.setItem("userEmail", loginData.email);

      // === XỬ LÝ VÀ LƯU userRole ===
      const userRole = mapRole(loginData.role); // Chuyển đổi role từ API
      localStorage.setItem("userRole", userRole); // Lưu role đã xử lý
      console.log(`Login successful. Role from API: ${loginData.role}. Saved userRole: ${userRole}`);

      // === DỌN DẸP KEY CŨ KHÔNG DÙNG NỮA ===
      localStorage.removeItem("authType");
      localStorage.removeItem("sellerId");

      // Xóa dữ liệu admin nếu có (Giữ nguyên)
      ["adminAuthType", "adminToken", "adminRefreshToken", "adminProfile"].forEach((k) =>
        localStorage.removeItem(k)
      );

      // === BỎ HOÀN TOÀN VIỆC GỌI sellerApi.getSellerProfile ===
      // console.log("Vai trò đã được xác định từ API login.");

      // Step 4: Lấy avatar (Giữ nguyên)
      try {
        const profileResponse = await profileApi.getProfile();
        const profileData = profileResponse?.data?.data;
        if (profileData?.avatarUrl) {
          localStorage.setItem("buyerAvatar", profileData.avatarUrl);
          console.log("Avatar saved on login:", profileData.avatarUrl);
        } else {
          localStorage.removeItem("buyerAvatar");
        }
      } catch (err) {
        console.warn("Không lấy được avatar khi đăng nhập:", err.message);
        localStorage.removeItem("buyerAvatar"); // Đảm bảo xóa nếu lỗi
      }

      // Step 5: Thông báo cập nhật và chuyển trang (Giữ nguyên)
      window.dispatchEvent(new CustomEvent("authStatusChanged"));
      navigate("/"); // Chuyển về trang chủ

    } catch (error) {
      console.error("Lỗi đăng nhập:", error.response?.data || error.message);
      setBackendError(
        error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại."
      );

      // Xóa sạch nếu lỗi (Đảm bảo xóa các key liên quan)
      [
        "accessToken", "refreshToken", "token",
        "username", "userEmail", "buyerId", "buyerAvatar",
        "authType", "sellerId", // Xóa key cũ
        "userRole", // <<< Xóa key mới
        "activeSellerPackage" // Xóa thông tin gói nếu có lỗi đăng nhập
      ].forEach((k) => localStorage.removeItem(k));
    }
  };

  // ===== GOOGLE LOGIN (ĐÃ SỬA TƯƠNG TỰ) =====
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await authApi.googleSignin(credentialResponse.credential);
      const loginData = response?.data?.data;
      // === KIỂM TRA RESPONSE GOOGLE CÓ ROLE KHÔNG ===
      if (!loginData?.accessToken || !loginData?.role) { // Giả định API google cũng trả role
         console.error("Google login response missing token or role:", loginData);
         throw new Error("Google login lỗi hoặc thiếu thông tin role!");
      }

      localStorage.setItem("accessToken", loginData.accessToken);
      localStorage.setItem("refreshToken", loginData.refreshToken);
      localStorage.setItem("token", loginData.accessToken);
      localStorage.setItem("username", loginData.username);
      localStorage.setItem("userEmail", loginData.email);

      // === XỬ LÝ VÀ LƯU userRole ===
      const userRole = mapRole(loginData.role);
      localStorage.setItem("userRole", userRole);
      console.log(`Google Login successful. Role: ${loginData.role}. Saved userRole: ${userRole}`);

      // === DỌN DẸP KEY CŨ ===
      localStorage.removeItem("authType");
      localStorage.removeItem("sellerId");

      // === BỎ GỌI sellerApi.getSellerProfile ===

      // <<< Cân nhắc thêm logic lấy avatar ở đây nếu cần >>>
      try {
        const profileResponse = await profileApi.getProfile();
        const profileData = profileResponse?.data?.data;
        if (profileData?.avatarUrl) {
          localStorage.setItem("buyerAvatar", profileData.avatarUrl);
          console.log("Avatar saved on Google login:", profileData.avatarUrl);
        } else {
          localStorage.removeItem("buyerAvatar");
        }
      } catch (err) {
        console.warn("Không lấy được avatar khi đăng nhập Google:", err.message);
        localStorage.removeItem("buyerAvatar");
      }

      window.dispatchEvent(new CustomEvent("authStatusChanged"));
      navigate("/");
    } catch (error) {
      console.error("Google login error:", error);
      setBackendError("Đăng nhập Google thất bại.");
      // Xóa các key khi lỗi
      [ "accessToken", "refreshToken", "token", "username", "userEmail", "buyerId", "buyerAvatar", "authType", "sellerId", "userRole", "activeSellerPackage" ].forEach((k) => localStorage.removeItem(k));
    }
  };

  const handleGoogleError = () => {
     console.error("Google login process error.");
     setBackendError("Đăng nhập Google thất bại. Vui lòng thử lại.");
   }

  // ===== UI (Giữ nguyên) =====
  return (
    <form className="sign-in-form" onSubmit={handleSubmit} noValidate>
      <div className="logo-container">
        <div className="greentrade-text">
          <span className="green-text">Green</span>
          <span className="trade-text">Trade</span>
        </div>
        <div className="logo-glow"></div>
      </div>

      <h2 className="title">Đăng nhập</h2>

      <div className={`input-field ${errors.username ? "error" : ""}`}>
        <i className="fas fa-user"></i>
        <input
          type="text"
          name="username"
          placeholder="Tên đăng nhập"
          value={formData.username}
          onChange={handleChange}
          onBlur={handleChange} // Thêm onBlur để validate khi rời khỏi input
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? "username-error" : undefined}
        />
      </div>
      {errors.username && <p id="username-error" className="error-message">{errors.username}</p>}

      <div className={`input-field ${errors.password ? "error" : ""}`}>
        <i className="fas fa-lock"></i>
        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          value={formData.password}
          onChange={handleChange}
          onBlur={handleChange} // Thêm onBlur để validate khi rời khỏi input
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
      </div>
      {errors.password && <p id="password-error" className="error-message">{errors.password}</p>}

      {backendError && (
        <p className="error-message backend-error" style={{ textAlign: "center" }}>
          {backendError}
        </p>
      )}

      <a
        href="#"
        className="forgot-password"
        onClick={(e) => {
          e.preventDefault();
          navigate("/forgot-password"); // Điều hướng đến trang quên mật khẩu
        }}
      >
        Quên mật khẩu?
      </a>

      <input type="submit" value="Đăng nhập" className="btn solid" />

      <p className="divider">
        <span>hoặc đăng nhập bằng</span>
      </p>

      <div className="google-login-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap // Tùy chọn: bật one-tap login
          auto_select // Tùy chọn: tự động chọn nếu chỉ có 1 tài khoản Google
        />
      </div>

      <p className="switch-text">
        Chưa có tài khoản?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("/signup"); // Điều hướng đến trang đăng ký
          }}
        >
          Đăng ký ngay
        </a>
      </p>
    </form>
  );
}


