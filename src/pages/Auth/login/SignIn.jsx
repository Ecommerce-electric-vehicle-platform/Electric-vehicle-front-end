import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import authApi from "../../../api/authApi";
import profileApi from "../../../api/profileApi";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";


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
            else if (!/^[A-Za-z]+$/.test(value)) message = "Chỉ được phép sử dụng chữ cái."; // 👈 giữ logic regex của bạn
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
    // ===== SUBMIT -  SỬA LẠI HOÀN TOÀN HÀM NÀY  =====
const handleSubmit = async (e) => {
    e.preventDefault();
    // (Validation giữ nguyên)
    const allValid = validateAll();
    if (!allValid) return;

    try {
        // Bước 1: Gọi API Đăng nhập
        const loginResponse = await authApi.signin(formData);
        const loginData = loginResponse?.data?.data;

        // Kiểm tra xem có token trả về không
        if (loginData?.accessToken && loginData?.refreshToken) {
            // Bước 2: Lưu token và thông tin cơ bản VÀO LOCALSTORAGE TRƯỚC
            localStorage.setItem("accessToken", loginData.accessToken);
            localStorage.setItem("refreshToken", loginData.refreshToken);
            localStorage.setItem("token", loginData.accessToken); // Giữ lại nếu cần
            localStorage.setItem("username", loginData.username);
            localStorage.setItem("userEmail", loginData.email);
            if (loginData.buyerId) {
                localStorage.setItem("buyerId", loginData.buyerId);
            } else {
                localStorage.removeItem("buyerId");
            }

            // ---  BƯỚC 3: GỌI THÊM API getProfile ĐỂ LẤY AVATAR  ---
            try {
                // AxiosInstance sẽ tự động dùng token vừa lưu ở Bước 2
                const profileResponse = await profileApi.getProfile();
                const profileData = profileResponse?.data?.data; // Bóc 2 lớp data

                // Lưu avatar vào localStorage
                if (profileData?.avatarUrl) {
                    localStorage.setItem("buyerAvatar", profileData.avatarUrl);
                    console.log("Avatar saved to localStorage:", profileData.avatarUrl); // DEBUG
                } else {
                    // Nếu getProfile thành công nhưng không có avatarUrl (user mới chưa upload)
                    localStorage.removeItem("buyerAvatar");
                    console.log("No avatarUrl found in profile, removing from localStorage."); // DEBUG
                }
            } catch (profileError) {
                // Nếu gọi getProfile bị lỗi (VD: user mới chưa có profile -> 404)
                console.error("Lỗi khi lấy profile sau khi login (có thể là user mới):", profileError.message);
                // Quan trọng: Phải xóa avatar cũ (nếu có) khi getProfile lỗi
                localStorage.removeItem("buyerAvatar");
            }
            // --- ------------------------------------------ ---

            // Bước 4: Thông báo các component khác và chuyển hướng
            window.dispatchEvent(new CustomEvent('authStatusChanged'));
            setBackendError(""); // Xóa lỗi cũ (nếu có)
            navigate("/"); // Chuyển về trang chủ

        } else {
            // Nếu API login không trả về token như mong đợi
            throw new Error("API login không trả về token.");
        }
    } catch (error) {
        // Xử lý lỗi từ Bước 1 (API Login) hoặc Bước 3 (API getProfile)
        console.error("Lỗi trong quá trình đăng nhập:", error.response?.data || error.message);
        const backendMsg = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
        setBackendError(backendMsg);

        // Quan trọng: Xóa sạch localStorage nếu có bất kỳ lỗi nào xảy ra
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("buyerId");
        localStorage.removeItem("buyerAvatar");
        // Không dispatch event 'authStatusChanged' khi lỗi
    }
};

    // ===== GOOGLE LOGIN =====
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);
            console.log("Google user:", decoded);

            const response = await authApi.googleSignin(
                credentialResponse.credential
            );
            const resData = response?.data?.data;

            if (resData?.accessToken) {
                localStorage.setItem("accessToken", resData.accessToken);
                localStorage.setItem("username", resData.username);
                
                if (resData.avatarUrl) {
                    localStorage.setItem("buyerAvatar", resData.avatarUrl);
                } else {
                    localStorage.removeItem("buyerAvatar");
                }
            
            }

            navigate("/");
        } catch (error) {
            console.error("Google login error:", error);
            setBackendError("Đăng nhập Google thất bại.");
        }
    };

    const handleGoogleError = () => {
        setBackendError("Đăng nhập Google thất bại. Vui lòng thử lại.");
    };

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
