import React, { useState } from "react";
import logo from "../../../assets/logo/Logo 2.png";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import authApi from "../../../api/authApi";
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
    Object.entries(formData).forEach(([key, value]) =>
      validateField(key, value)
    );
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    const allValid = validateAll();

    if (!allValid) return;

    try {
      const response = await authApi.signin(formData);
      const resData = response?.data?.data;

      if (resData?.accessToken && resData?.refreshToken) {
        localStorage.setItem("accessToken", resData.accessToken);
        localStorage.setItem("refreshToken", resData.refreshToken);
        localStorage.setItem("username", resData.username);
      }

      setBackendError("");
      console.log("Login success:", resData);
      navigate("/");
    } catch (error) {
      console.error("Signin error:", error.response?.data || error.message);
      const backendMsg =
        error.response?.data?.message || "Login failed. Try again.";
      setBackendError(backendMsg);
    }
  };

  // ===== GOOGLE LOGIN =====
  const handleGoogleSuccess = async (response) => {
    console.log("Google response:", response);
    try {
      const res = await authApi.googleSignin(response.credential);
      console.log("Backend response:", res.data);

      // lưu token và điều hướng
      const data = res.data?.data;
      if (data?.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("username", data.username);
        navigate("/");
      }
    } catch (error) {
      console.error("Google login error:", error.response || error);
      setBackendError("Google login failed. Please try again.");
    }
  };

  const handleGoogleError = () => {
    console.log("Google login failed");
    setBackendError("Google login failed.");
  };

  return (
    <form className="sign-in-form" onSubmit={handleSubmit} noValidate>
      <img src={logo} alt="GreenTrade Logo" className="gt-logo" />
      <h2 className="title">Sign in</h2>

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
      {errors.username && <p className="error-message">{errors.username}</p>}

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
      {errors.password && <p className="error-message">{errors.password}</p>}

      {backendError && (
        <p className="error-message" style={{ textAlign: "center" }}>
          {backendError}
        </p>
      )}

      <a href="#" className="forgot-password">
        Forgot password?
      </a>

      <input type="submit" value="Sign in" className="btn solid" />

      <p className="divider">
        <span>or Sign in with</span>
      </p>

      <div className="google-login-wrapper">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          shape="pill"
          text="signin_with"
          width="280"
        />
      </div>

      <p className="switch-text">
        Don’t have an account?{" "}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("/signup");
          }}
        >
          Sign up
        </a>
      </p>
    </form>
  );
}
