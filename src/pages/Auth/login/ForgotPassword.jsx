import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../../../api/authApi"; // dùng API giống sign up
import logo from "../../../assets/logo/Logo 2.png";
import "./auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP, 3: đặt mật khẩu
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await authApi.forgotPassword({ email });
      setStep(2);
      setSuccess("OTP has been sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await authApi.verifyForgotOtp({ email, otp });
      setStep(3);
      setSuccess("OTP verified. Please set a new password.");
    } catch (err) {
      setError("Invalid or expired OTP.");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await authApi.resetPassword({ email, otp, newPassword });
      setSuccess("Password reset successfully!");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    }
  };

  return (
    <form
      className="sign-up-form"
      onSubmit={
        step === 1 ? handleSendOtp : step === 2 ? handleVerifyOtp : handleResetPassword
      }
    >
      <img src={logo} alt="GreenTrade Logo" className="gt-logo" />
      <h2 className="title">
        {step === 1 && "Forgot Password"}
        {step === 2 && "Verify OTP"}
        {step === 3 && "Set New Password"}
      </h2>

      {step === 1 && (
        <>
          <div className="input-field">
            <i className="fas fa-envelope"></i>
            <input
              type="text"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <input type="submit" value="Send OTP" className="btn solid" />
        </>
      )}

      {step === 2 && (
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
          <input type="submit" value="Verify OTP" className="btn solid" />
        </>
      )}

      {step === 3 && (
        <>
          <div className="input-field">
            <i className="fas fa-lock"></i>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <input type="submit" value="Reset Password" className="btn solid" />
        </>
      )}

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <p className="switch-text">
        Remember your password?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("/signin");
          }}
        >
          Back to Sign In
        </a>
      </p>
    </form>
  );
}
