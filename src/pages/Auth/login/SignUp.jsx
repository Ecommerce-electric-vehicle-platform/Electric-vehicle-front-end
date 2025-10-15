import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import authApi from "../../../api/authApi";
import { GoogleLogin } from "@react-oauth/google";

export default function SignUp() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });
  const [errors, setErrors] = useState({});
  const [backendError, setBackendError] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showAgreeError, setShowAgreeError] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // ===== VALIDATION =====
  const validateField = (name, value) => {
    let message = "";
    if (name === "username") {
      if (!value.trim()) message = "Tên đăng nhập là bắt buộc.";
      else if (!/^[A-Za-z]+$/.test(value)) message = "Chỉ được phép sử dụng chữ cái.";
      else if (value.length < 8) message = "Tối thiểu 8 ký tự.";
    }
    if (name === "password") {
      if (!value.trim()) message = "Mật khẩu là bắt buộc.";
      else if (/\s/.test(value)) message = "Không được có khoảng trắng.";
      else if (value.length < 8) message = "Tối thiểu 8 ký tự.";
      else if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/.test(value))
        message = "Phải bao gồm chữ cái, số và ký tự đặc biệt.";
    }
    if (name === "email") {
      if (!value.trim()) message = "Email là bắt buộc.";
      else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value))
        message = "Email không hợp lệ.";
    }
    setErrors((prev) => ({ ...prev, [name]: message }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
    setBackendError("");
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

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    const allValid = validateAll();
    if (!allValid) return;
    if (!isAgreed) {
      setShowAgreeError(true);
      return;
    }

    try {
      setLoadingMessage("Vui lòng kiểm tra email. Đang chuyển đến trang OTP...");
      await authApi.signup(formData);
      setTimeout(() => {
        setIsOtpStep(true);
        setBackendError("");
        setLoadingMessage("");
      }, 2500);
    } catch (error) {
      setLoadingMessage("");
      console.error("Lỗi đăng ký:", error.response?.data || error.message);
      const backendMsg =
        error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      setBackendError(backendMsg);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      await authApi.verifyOtp({
        email: formData.email,
        otp: otp,
      });
      navigate("/signin");
    } catch (error) {
      setBackendError("Mã OTP không hợp lệ hoặc đã hết hạn.");
    }
  };

  // ===== GOOGLE SIGNUP =====
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const idToken = credentialResponse?.credential;
      if (!idToken) {
        setBackendError("Không nhận được token từ Google. Vui lòng thử lại.");
        return;
      }
      const response = await authApi.googleSignin(idToken);
      console.log("Google signin/signup response:", response.data);
      navigate("/signin");
    } catch (error) {
      console.error("Google signup error:", error);
      const status = error.response?.status;
      const message =
        status === 401
          ? "Token Google không hợp lệ hoặc đã hết hạn."
          : error.response?.data?.message ||
          "Đăng nhập/Đăng ký Google thất bại. Vui lòng thử lại.";
      setBackendError(message);
    }
  };

  const handleGoogleError = () => {
    setBackendError("Đăng nhập Google thất bại. Vui lòng thử lại.");
  };

  // ===== UI =====
  return (
    <div className="auth-form-container">
      <form
        className="sign-up-form"
        onSubmit={isOtpStep ? handleVerifyOtp : handleSubmit}
        noValidate
      >
        {/* Header */}
        <div className="form-header">
          <div className="logo-container">
            <div className="greentrade-text">
              <span className="green-text">Green</span>
              <span className="trade-text">Trade</span>
            </div>
            <div className="logo-glow"></div>
          </div>
          <h2 className="title">
            {isOtpStep ? (
              <>
                <span className="title-main">Xác thực OTP</span>
                <span className="title-sub">Nhập mã xác thực từ email</span>
              </>
            ) : (
              "Đăng ký"
            )}
          </h2>
        </div>

        <div className="form-body">
          {!isOtpStep ? (
            <>
              {/* Username */}
              <div className="input-group">
                <div className={`input-field ${errors.username ? "error" : ""}`}>
                  <div className="input-icon">
                    <i className="fas fa-user"></i>
                  </div>
                  <input
                    type="text"
                    name="username"
                    placeholder="Tên đăng nhập"
                    value={formData.username}
                    onChange={handleChange}
                  />
                  <div className="input-border"></div>
                </div>
                {errors.username && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.username}</span>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="input-group">
                <div className={`input-field ${errors.password ? "error" : ""}`}>
                  <div className="input-icon">
                    <i className="fas fa-lock"></i>
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="Mật khẩu"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <div className="input-border"></div>
                </div>
                {errors.password && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.password}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="input-group">
                <div className={`input-field ${errors.email ? "error" : ""}`}>
                  <div className="input-icon">
                    <i className="fas fa-envelope"></i>
                  </div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <div className="input-border"></div>
                </div>
                {errors.email && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              {/* Backend Error */}
              {backendError && (
                <div className="backend-error">
                  <i className="fas fa-times-circle"></i>
                  <span>{backendError}</span>
                </div>
              )}

              {/* Điều khoản */}
              <div className="agree-wrapper">
                <label className="agree">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => {
                      setIsAgreed(e.target.checked);
                      setShowAgreeError(false);
                    }}
                  />
                  <span className="checkmark"></span>
                  <span className="label-text">
                    Tôi đồng ý với <a href="#">Điều khoản & Chính sách</a>
                  </span>
                </label>
                {showAgreeError && (
                  <div className="agree-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Vui lòng đồng ý với điều khoản để tiếp tục.</span>
                  </div>
                )}
              </div>

              <button type="submit" className="btn solid">
                Đăng ký
              </button>

              <div className="divider">
                <span className="divider-text">hoặc đăng ký bằng</span>
              </div>

              {/* Google Login */}
              <div className="google-login-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  text="signup_with"
                />
              </div>
            </>
          ) : (
            <>
              {/* OTP UI */}
              <div className="otp-container">
                <div className="otp-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <p className="otp-description">
                  Chúng tôi đã gửi mã xác thực đến email{" "}
                  <strong>{formData.email}</strong>
                </p>
              </div>

              <div className="input-group">
                <div className="input-field">
                  <div className="input-icon">
                    <i className="fas fa-key"></i>
                  </div>
                  <input
                    type="text"
                    placeholder="Nhập mã OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength="6"
                  />
                  <div className="input-border"></div>
                </div>
              </div>

              {backendError && (
                <div className="backend-error">
                  <i className="fas fa-times-circle"></i>
                  <span>{backendError}</span>
                </div>
              )}

              <button type="submit" className="btn solid">
                Xác thực OTP
              </button>

              <div className="resend-otp">
                <p>
                  Không nhận được mã? <a href="#">Gửi lại</a>
                </p>
              </div>
            </>
          )}
        </div>

        {!isOtpStep && (
          <div className="form-footer">
            <p className="switch-text">
              Đã có tài khoản?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/signin");
                }}
                className="switch-link"
              >
                Đăng nhập ngay
              </a>
            </p>
          </div>
        )}

        {loadingMessage && (
          <div className="loading-overlay">
            <div className="loading-content">
              <div className="loading-icon">
                <i className="fas fa-envelope"></i>
              </div>
              <h3>Đang gửi email...</h3>
              <p>{loadingMessage}</p>
              <div className="spinner"></div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
