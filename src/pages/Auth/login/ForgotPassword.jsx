// src/pages/Auth/forgot/ForgotPassword.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../../../api/authApi";
import logo from "../../../assets/logo/Logo 2.png";
import "./auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
    email: "",
    token: "", // token sẽ nhận được từ BE sau khi verify OTP
  });
  const [status, setStatus] = useState({
    error: "",
    success: "",
    loading: false,
  });

  // ========== VALIDATION ==========
  const validateUsername = (value) => {
    if (!value.trim()) return "Tên đăng nhập là bắt buộc.";
    if (!/^[A-Za-z]+$/.test(value))
      return "Chỉ được phép chứa chữ, số, gạch dưới.";
    if (value.length < 4) return "Tên đăng nhập phải có ít nhất 4 ký tự.";
    return "";
  };

  const validatePassword = (value) => {
    if (!value.trim()) return "Mật khẩu là bắt buộc.";
    if (value.length < 8) return "Tối thiểu 8 ký tự.";
    if (/\s/.test(value)) return "Không được có khoảng trắng.";
    if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/.test(value))
      return "Phải gồm chữ cái, số và ký tự đặc biệt.";
    return "";
  };

  // ========== HANDLE INPUT ==========
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setStatus({ error: "", success: "", loading: false });
  };

  // ========== SUBMIT HANDLER ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: "", success: "", loading: true });

    try {
      // B1: Xác minh username, gửi OTP
      if (step === 1) {
        const usernameError = validateUsername(formData.username);
        if (usernameError) throw new Error(usernameError);

        const res = await authApi.verifyUsernameForgotPassword({
          username: formData.username,
        });

        // Log full response
        console.log("Response verify username (full):", res);

        // Trích xuất email đúng từ response BE
        const extractedEmail =
          res?.data?.data?.data?.email ||
          res?.data?.email ||
          res?.data?.gmail ||
          res?.data?.data?.email ||
          res?.data?.data?.gmail ||
          null;

        // Lưu email/gmail vào state (sử dụng key `email` trong front-end)
        setFormData((prev) => ({
          ...prev,
          email: extractedEmail,
        }));

        console.log("Extracted email/gmail from response:", extractedEmail);

        setStatus({
          error: "",
          success: "OTP đã được gửi đến email đăng ký.",
          loading: false,
        });
        setStep(2);
      }

      // B2: Xác minh OTP (gửi username + otp)
      else if (step === 2) {
        // Verify OTP
        if (!formData.otp.trim()) throw new Error("Vui lòng nhập OTP.");

        // Sử dụng email đã lưu trong state, không dùng form input
        const gmailToSend = formData.email || null;

        const otpPayload = {
          username: formData.username,
          otp: formData.otp,
          email: gmailToSend, // đổi từ gmail sang email
        };

        console.log("Sending OTP verification data:", otpPayload);

        const res = await authApi.verifyOtpForgotPassword(otpPayload);

        // Lưu token từ response của BE
        setFormData((prev) => ({
          ...prev,
          token: res.data.token,
        }));

        console.log("Response verify OTP:", res.data);

        setStatus({
          error: "",
          success: "OTP hợp lệ. Hãy nhập mật khẩu mới.",
          loading: false,
        });
        setStep(3);
      }

      // B3: Đặt lại mật khẩu
      else if (step === 3) {
        const pwError = validatePassword(formData.newPassword);
        if (pwError) throw new Error(pwError);
        if (formData.newPassword !== formData.confirmPassword)
          throw new Error("Mật khẩu xác nhận không khớp.");

        const res = await authApi.forgotPassword({
          username: formData.username,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        });

        console.log("Response reset password:", res.data);

        setStatus({
          error: "",
          success: "Đặt lại mật khẩu thành công! Đang chuyển hướng...",
          loading: false,
        });

        setTimeout(() => navigate("/signin"), 2000);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Đã xảy ra lỗi. Vui lòng thử lại.";
      console.error("ForgotPassword error:", msg);
      setStatus({ error: msg, success: "", loading: false });
    }
  };

  // ========== UI ==========
  return (
    <form className="sign-up-form" onSubmit={handleSubmit} noValidate>
      <img src={logo} alt="GreenTrade Logo" className="gt-logo" />
      <h2 className="title">
        {step === 1 && "Xác minh tài khoản"}
        {step === 2 && "Nhập mã OTP"}
        {step === 3 && "Đặt lại mật khẩu"}
      </h2>

      {/* Step 1 - Username */}
      {step === 1 && (
        <div className="input-field">
          <i className="fas fa-user"></i>
          <input
            type="text"
            name="username"
            placeholder="Nhập tên đăng nhập"
            value={formData.username}
            onChange={handleChange}
          />
        </div>
      )}

      {/* Step 2 - OTP */}
      {step === 2 && (
        <div className="input-field">
          <i className="fas fa-key"></i>
          <input
            type="text"
            name="otp"
            placeholder="Nhập mã OTP"
            value={formData.otp}
            onChange={handleChange}
          />
        </div>
      )}

      {/* Step 3 - New Password */}
      {step === 3 && (
        <>
          <div className="input-field">
            <i className="fas fa-lock"></i>
            <input
              type="password"
              name="newPassword"
              placeholder="Mật khẩu mới"
              value={formData.newPassword}
              onChange={handleChange}
            />
          </div>
          <div className="input-field">
            <i className="fas fa-lock"></i>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
        </>
      )}

      {status.error && <p className="error-message">{status.error}</p>}
      {status.success && <p className="success-message">{status.success}</p>}

      <input
        type="submit"
        value={
          status.loading
            ? "Đang xử lý..."
            : step === 1
            ? "Gửi OTP"
            : step === 2
            ? "Xác minh OTP"
            : "Đặt lại mật khẩu"
        }
        className="btn solid"
        disabled={status.loading}
      />

      <p className="switch-text">
        Quay lại{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("/signin");
          }}
        >
          Đăng nhập
        </a>
      </p>
    </form>
  );
}
