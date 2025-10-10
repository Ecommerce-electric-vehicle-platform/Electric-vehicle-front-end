import React, { useState } from "react";
import logo from "../../../assets/logo/Logo 2.png";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import authApi from "../../../api/authApi"; // import api từ file riêng
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

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

  // ========== VALIDATION ==========
  const validateField = (name, value) => {
    let message = "";

    if (name === "username") {
      if (!value.trim()) message = "Username required.";
      else if (!/^[A-Za-z]+$/.test(value)) message = "Only letters allowed.";
      else if (value.length < 8) message = "At least 8 letters.";
    }

    if (name === "password") {
      if (!value.trim()) message = "Password required.";
      else if (/\s/.test(value)) message = "No spaces.";
      else if (value.length < 8) message = "At least 8 chars.";
      else if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/.test(value))
        message = "Include letters, numbers, symbols.";
    }

    if (name === "email") {
      if (!value.trim()) message = "Email required.";
      else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value))
        message = "Invalid email.";
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
      let message = "";
      if (key === "username") {
        if (!value.trim()) message = "Username required.";
        else if (!/^[A-Za-z]+$/.test(value)) message = "Only letters allowed.";
        else if (value.length < 8) message = "At least 8 letters.";
      }

      if (key === "password") {
        if (!value.trim()) message = "Password required.";
        else if (/\s/.test(value)) message = "No spaces.";
        else if (value.length < 8) message = "At least 8 chars.";
        else if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/.test(value))
          message = "Include letters, numbers, symbols.";
      }

      if (key === "email") {
        if (!value.trim()) message = "Email required.";
        else if (
          !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
        )
          message = "Invalid email.";
      }

      if (message) newErrors[key] = message;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ========== HANDLE SUBMIT ==========
  const handleSubmit = async (e) => {
    e.preventDefault();

    const allValid = validateAll();

    if (!allValid) {
      setShowAgreeError(false);
      return;
    }

    if (!isAgreed) {
      setShowAgreeError(true);
      return;
    }

    try {
      //  Dùng api tách riêng, không gọi axios trực tiếp
      const response = await authApi.signup(formData);
      setIsOtpStep(true);
      setBackendError("");
    } catch (error) {
      console.error("Signup error:", error.response?.data || error.message);
      const backendMsg =
        error.response?.data?.message || "Signup failed. Try again.";
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
      setBackendError("Invalid OTP or expired.");
    }
  };

  // ======== GOOGLE SIGNUP =========
const handleGoogleSuccess = async (response) => {
  try {
    const userInfo = jwtDecode(response.credential);
    console.log("Google user info:", userInfo);

    // Gửi dữ liệu này lên backend để tạo tài khoản
    const res = await authApi.googleSignup({
      email: userInfo.email,
      name: userInfo.name,
      googleId: userInfo.sub, // ID duy nhất của tài khoản GG
    });

    console.log("Server response:", res);
    navigate("/signin"); // hoặc điều hướng vào trang chính nếu muốn
  } catch (error) {
    console.error("Google signup error:", error);
    setBackendError("Google sign up failed. Please try again.");
  }
};

const handleGoogleError = () => {
  console.log("Google login failed");
  setBackendError("Google sign up failed.");
};


  // ========== UI ==========
  return (
    <form
      className="sign-up-form"
      onSubmit={isOtpStep ? handleVerifyOtp : handleSubmit}
      noValidate
    >
      <img src={logo} alt="GreenTrade Logo" className="gt-logo" />
      <h2 className="title">
        {isOtpStep ? "Verify your OTP" : "Join the Green Revolution"}
      </h2>

      {!isOtpStep ? (
        <>
          <div className={`input-field ${errors.username ? "error" : ""}`}>
            <i className="fas fa-user"></i>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          {errors.username && (
            <p className="error-message">{errors.username}</p>
          )}

          <div className={`input-field ${errors.password ? "error" : ""}`}>
            <i className="fas fa-lock"></i>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          {errors.password && (
            <p className="error-message">{errors.password}</p>
          )}

          <div className={`input-field ${errors.email ? "error" : ""}`}>
            <i className="fas fa-envelope"></i>
            <input
              type="text"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          {errors.email && <p className="error-message">{errors.email}</p>}

          {backendError && (
            <p className="error-message" style={{ textAlign: "center" }}>
              {backendError}
            </p>
          )}

          <div className="agree-wrapper">
            <label className="agree">
              <input
                type="checkbox"
                checked={isAgreed}
                onChange={(e) => {
                  setIsAgreed(e.target.checked);
                  setShowAgreeError(false);
                }}
              />{" "}
              I agree to <a href="#">Terms & Privacy</a>
            </label>

            {showAgreeError && (
              <div className="agree-error">
                <span className="warning-icon">⚠️</span>
                Please check this box if you want to proceed.
              </div>
            )}

            {/*  Overlay loading */}
            {loadingMessage && (
                <div className="loading-overlay">
                    <div className="loading-content">
                        <p>📩 {loadingMessage}</p>
                        <div className="spinner"></div>
                    </div>
                </div>
            )}
        </form>
    );
}
