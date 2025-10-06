import React, { useState } from "react";
import logo from "../../../assets/logo/Logo 2.png";
import { useNavigate } from "react-router-dom";
import authApi from "../../../api/authApi";

export default function SignIn() {
  const navigate = useNavigate();

  // State lưu thông tin người dùng nhập
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Hàm xử lý khi submit form
  const handleSubmit = async (e) => {
    e.preventDefault(); // Ngăn reload trang
    setLoading(true);

    try {
      // Gọi API đăng nhập
      const res = await authApi.signIn(username, password);
      console.log("Kết quả API:", res.data);

      if (res.data.success) {
        alert("Signed in successfully");

        // Lưu token vào localStorage
        localStorage.setItem("accessToken", res.data.data.accessToken);

        // Điều hướng sang trang chính sau khi đăng nhập
        navigate("/dashboard");
      } else {
        alert(res.data.message || "Wrong account or password");
      }
    } catch (err) {
      console.error("Lỗi khi gọi API:", err);
      alert("Không thể kết nối API. ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="sign-in-form" onSubmit={handleSubmit}>
      <img src={logo} alt="GreenTrade Logo" className="gt-logo" />
      <h2 className="title">Sign in</h2>

      <div className="input-field">
        <i className="fas fa-user"></i>
        <input
          type="text"
          placeholder="Username or Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>

      <div className="input-field">
        <i className="fas fa-lock"></i>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <a href="#" className="forgot-password">
        Forgot password?
      </a>

      <input
        type="submit"
        value={loading ? "Signing in..." : "Sign in"}
        className="btn solid"
        disabled={loading}
      />

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
