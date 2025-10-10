import React, { useState } from "react";
import logo from "../../../assets/logo/Logo 2.png";
import { useNavigate } from "react-router-dom";
import "./auth.css";
import authApi from "../../../api/authApi";

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
            // lưu token vào localStorage
            localStorage.setItem("accessToken", resData.accessToken);
            localStorage.setItem("refreshToken", resData.refreshToken);
            localStorage.setItem("username", resData.username);
        }

        setBackendError("");
        console.log("Login success:", resData);
        navigate("/profile");
    } catch (error) {
        console.error("Signin error:", error.response?.data || error.message);
        const backendMsg =
            error.response?.data?.message || "Login failed. Try again.";
        setBackendError(backendMsg);
    }
};


    // ===== UI =====
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

            <button type="button" className="btn google-btn">
                <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google Icon"
                />
                Sign in with Google
            </button>

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
