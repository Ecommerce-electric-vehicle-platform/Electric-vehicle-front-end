import React, { useState } from "react";
import logo from "../../../assets/logo/Logo 2.png";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import authApi from "../../../api/authApi"; //  import api từ file riêng

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
            else if (
                !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)
            )
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
            // 🟢 hiển thị thông báo chờ
            setLoadingMessage("Please check your email. Redirecting to OTP page...");
            const response = await authApi.signup(formData);

            // 🕒 giả lập delay để hiển thị message 2.5s
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
        <div className="auth-form-container">
            <form
                className="sign-up-form"
                onSubmit={isOtpStep ? handleVerifyOtp : handleSubmit}
                noValidate
            >
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
                            <>
                                <span className="title-main">Đăng ký</span>
                                <span className="title-sub">Tham gia cuộc cách mạng xanh!</span>
                            </>
                        )}
                    </h2>
                </div>

                <div className="form-body">
                    {!isOtpStep ? (
                        <>
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

                            {backendError && (
                                <div className="backend-error">
                                    <i className="fas fa-times-circle"></i>
                                    <span>{backendError}</span>
                                </div>
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

                            <button type="submit" className="btn primary-btn">
                                <span className="btn-text">Đăng ký</span>
                                <div className="btn-shine"></div>
                                <i className="fas fa-user-plus btn-icon"></i>
                            </button>

                            <div className="divider">
                                <span className="divider-text">hoặc đăng ký bằng</span>
                            </div>

                            <button type="button" className="btn google-btn">
                                <div className="google-icon">
                                    <img
                                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                        alt="Google Icon"
                                    />
                                </div>
                                <span className="btn-text">Google</span>
                                <div className="btn-shine"></div>
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="otp-container">
                                <div className="otp-icon">
                                    <i className="fas fa-shield-alt"></i>
                                </div>
                                <p className="otp-description">
                                    Chúng tôi đã gửi mã xác thực đến email <strong>{formData.email}</strong>
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

                            <button type="submit" className="btn primary-btn">
                                <span className="btn-text">Xác thực OTP</span>
                                <div className="btn-shine"></div>
                                <i className="fas fa-check btn-icon"></i>
                            </button>

                            <div className="resend-otp">
                                <p>Không nhận được mã? <a href="#">Gửi lại</a></p>
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

                {/* Loading Overlay */}
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
