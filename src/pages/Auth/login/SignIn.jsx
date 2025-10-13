import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import authApi from "../../../api/authApi";
import { GoogleLogin } from "@react-oauth/google"; // ✅ Thêm Google Login

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
                if (!value.trim()) message = "Tên đăng nhập là bắt buộc.";
                else if (!/^[A-Za-z]+$/.test(value)) message = "Chỉ được phép sử dụng chữ cái.";
                else if (value.length < 8) message = "Tối thiểu 8 ký tự.";
            }
            if (key === "password") {
                if (!value.trim()) message = "Mật khẩu là bắt buộc.";
                else if (/\s/.test(value)) message = "Không được có khoảng trắng.";
                else if (value.length < 8) message = "Tối thiểu 8 ký tự.";
                else if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/.test(value))
                    message = "Phải bao gồm chữ cái, số và ký tự đặc biệt.";
            }
            if (message) newErrors[key] = message;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ===== SUBMIT =====
    const handleSubmit = async (e) => {
        e.preventDefault();
        const allValid = validateAll();

        if (!allValid) {
            console.log("Form không hợp lệ, kiểm tra lại username/password");
            return;
        }

        try {
            const response = await authApi.signin(formData);
            const resData = response?.data?.data;

            if (resData?.accessToken && resData?.refreshToken) {
                // ✅ Lưu token & thông tin user
                localStorage.setItem("accessToken", resData.accessToken);
                localStorage.setItem("refreshToken", resData.refreshToken);
                localStorage.setItem("username", resData.username);
                localStorage.setItem("buyerId", resData.buyerId);
                localStorage.setItem("userEmail", resData.email);
            }

            setBackendError("");
            console.log("Đăng nhập thành công:", resData);
            navigate("/"); // 👉 điều hướng về trang chủ
        } catch (error) {
            console.error("Lỗi đăng nhập:", error.response?.data || error.message);
            const backendMsg =
                error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
            setBackendError(backendMsg);
        }
    };

    // ===== GOOGLE LOGIN =====
    const handleGoogleSuccess = (response) => {
        console.log("Google Login Success:", response);
        // 👉 Sau này bạn có thể gọi API backend để xử lý token từ Google
    };

    const handleGoogleError = () => {
        console.error("Google Login Failed");
    };

    // ===== UI =====
    return (
        <form className="sign-in-form" onSubmit={handleSubmit} noValidate>
            {/* Logo */}
            <div className="logo-container">
                <div className="greentrade-text">
                    <span className="green-text">Green</span>
                    <span className="trade-text">Trade</span>
                </div>
                <div className="logo-glow"></div>
            </div>

            <h2 className="title">Đăng nhập</h2>

            {/* Username */}
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

            {/* Password */}
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

            {/* Backend Error */}
            {backendError && (
                <p className="error-message" style={{ textAlign: "center" }}>
                    {backendError}
                </p>
            )}

            <a href="#" className="forgot-password">
                Quên mật khẩu?
            </a>

            {/* Submit */}
            <input type="submit" value="Đăng nhập" className="btn solid" />

            <p className="divider">
                <span>hoặc đăng nhập bằng</span>
            </p>

            {/* ✅ GOOGLE LOGIN */}
            <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                shape="rectangular"
                text="signin_with"
            />

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
