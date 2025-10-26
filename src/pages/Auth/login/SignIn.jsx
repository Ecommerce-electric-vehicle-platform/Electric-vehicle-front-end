import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import authApi from "../../../api/authApi";
import profileApi from "../../../api/profileApi";
import sellerApi from "../../../api/sellerApi"; // kiểm tra seller profile
import { GoogleLogin } from "@react-oauth/google";

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
      else if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/.test(value))
        message = "Phải bao gồm chữ, số và ký tự đặc biệt.";
    }

    setErrors((prev) => ({ ...prev, [name]: message }));
  };

  const validateAll = () => {
    const newErrors = {};
    Object.entries(formData).forEach(([key, value]) => {
      validateField(key, value);
      if (errors[key]) newErrors[key] = errors[key];
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
    setBackendError("");
  };

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    try {
      // Step 1: Gọi API đăng nhập
      const loginResponse = await authApi.signin(formData);
      const loginData = loginResponse?.data?.data;

      if (!loginData?.accessToken || !loginData?.refreshToken)
        throw new Error("API login không trả về token hợp lệ.");

      // Step 2: Lưu token và info cơ bản
      localStorage.setItem("accessToken", loginData.accessToken);
      localStorage.setItem("refreshToken", loginData.refreshToken);
      localStorage.setItem("token", loginData.accessToken);
      localStorage.setItem("username", loginData.username);
      localStorage.setItem("userEmail", loginData.email);

      // Xóa dữ liệu admin nếu có
      ["adminAuthType", "adminToken", "adminRefreshToken", "adminProfile"].forEach((k) =>
        localStorage.removeItem(k)
      );

      console.log("Đăng nhập thành công, kiểm tra loại tài khoản...");

      // Step 3: Kiểm tra có phải SELLER không
      try {
        const sellerProfile = await sellerApi.getSellerProfile();
        if (sellerProfile?.data?.data?.sellerId) {
          localStorage.setItem("authType", "seller");
          localStorage.setItem("sellerId", sellerProfile.data.data.sellerId);
          console.log("Xác định là SELLER từ profile API");
        } else {
          localStorage.setItem("authType", "buyer");
          console.log("Không có seller profile → Buyer");
        }
      } catch {
        localStorage.setItem("authType", "buyer");
        console.log("Không có seller profile → Buyer");
      }

      // Step 4: Lấy avatar từ profile API
      try {
        const profileResponse = await profileApi.getProfile();
        const profileData = profileResponse?.data?.data;
        if (profileData?.avatarUrl) {
          localStorage.setItem("buyerAvatar", profileData.avatarUrl);
          console.log("Avatar saved:", profileData.avatarUrl);
        } else {
          localStorage.removeItem("buyerAvatar");
        }
      } catch (err) {
        console.warn("Không lấy được avatar:", err.message);
        localStorage.removeItem("buyerAvatar");
      }

      // Step 5: Thông báo cập nhật toàn hệ thống
      window.dispatchEvent(new CustomEvent("authStatusChanged"));
      navigate("/");
    } catch (error) {
      console.error("Lỗi đăng nhập:", error.response?.data || error.message);
      setBackendError(
        error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại."
      );

      // Xóa sạch nếu lỗi
      [
        "accessToken",
        "refreshToken",
        "token",
        "username",
        "userEmail",
        "buyerId",
        "buyerAvatar",
        "authType",
        "sellerId", // Thêm dòng này
      ].forEach((k) => localStorage.removeItem(k));
    }
  };

  // ===== GOOGLE LOGIN =====
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await authApi.googleSignin(credentialResponse.credential);
      const loginData = response?.data?.data;
      if (!loginData?.accessToken) throw new Error("Google login lỗi!");

      localStorage.setItem("accessToken", loginData.accessToken);
      localStorage.setItem("refreshToken", loginData.refreshToken);
      localStorage.setItem("token", loginData.accessToken);
      localStorage.setItem("username", loginData.username);
      localStorage.setItem("userEmail", loginData.email);

      try {
        const sellerProfile = await sellerApi.getSellerProfile();
        if (sellerProfile?.data?.data?.sellerId) {
          localStorage.setItem("authType", "seller");
          localStorage.setItem("sellerId", sellerProfile.data.data.sellerId);
        } else {
          localStorage.setItem("authType", "buyer");
        }
      } catch {
        localStorage.setItem("authType", "buyer");
      }

      window.dispatchEvent(new CustomEvent("authStatusChanged"));
      navigate("/");
    } catch (error) {
      console.error("Google login error:", error);
      setBackendError("Đăng nhập Google thất bại.");
      localStorage.removeItem("authType");
    }
  };

  const handleGoogleError = () =>
    setBackendError("Đăng nhập Google thất bại. Vui lòng thử lại.");

  // ===== UI =====
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
        />
      </div>
      {errors.username && <p className="error-message">{errors.username}</p>}

      <div className={`input-field ${errors.password ? "error" : ""}`}>
        <i className="fas fa-lock"></i>
        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          value={formData.password}
          onChange={handleChange}
        />
      </div>
      {errors.password && <p className="error-message">{errors.password}</p>}

      {backendError && (
        <p className="error-message" style={{ textAlign: "center" }}>
          {backendError}
        </p>
      )}

      <a
        href="#"
        className="forgot-password"
        onClick={(e) => {
          e.preventDefault();
          navigate("/forgot-password");
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
        />
      </div>

      <p className="switch-text">
        Chưa có tài khoản?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("/signup");
          }}
        >
          Đăng ký ngay
        </a>
      </p>
    </form>
  );
}
