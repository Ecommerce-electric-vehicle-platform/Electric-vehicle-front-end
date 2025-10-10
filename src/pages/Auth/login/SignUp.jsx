import React, { useState } from "react";
import logo from "../../../assets/logo/Logo 2.png";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import authApi from "../../../api/authApi"; //  import api từ file riêng
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
  const [loadingMessage, setLoadingMessage] = useState(""); // thêm state loading

  // ========== HANDLE GOOGLE LOGIN ==========
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const googleData = {
        username: decoded.name || decoded.email.split("@")[0],
        email: decoded.email,
        googleId: decoded.sub,
      };

      // Gọi API backend xử lý đăng ký Google
      const response = await authApi.googleSignup(googleData);

      console.log("Google signup response:", response.data);
      navigate("/signin");
    } catch (error) {
      console.error("Google signup error:", error);
      setBackendError("Google signup failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    setBackendError("Google Sign-In failed. Please try again.");
  };

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
      // hiển thị thông báo chờ
      setLoadingMessage("Please check your email. Redirecting to OTP page...");
      const response = await authApi.signup(formData);

      // giả lập delay để hiển thị message 2.5s
      setTimeout(() => {
        setIsOtpStep(true);
        setBackendError("");
        setLoadingMessage("");
      }, 2500);
    } catch (error) {
      setLoadingMessage("");
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
          </div>

          <input type="submit" value="Sign up" className="btn solid" />
        </>
      ) : (
        <>
          <div className="input-field">
            <i className="fas fa-key"></i>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>

          {backendError && (
            <p className="error-message" style={{ textAlign: "center" }}>
              {backendError}
            </p>
          )}

          <input type="submit" value="Verify OTP" className="btn solid" />
        </>
      )}

      {!isOtpStep && (
        <>
          <p className="divider">
            <span>or Sign up with</span>
          </p>

          <div className="google-login-wrapper">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>

          <p className="switch-text">
            Already have an account?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate("/signin");
              }}
            >
              Sign in
            </a>
          </p>
        </>
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
