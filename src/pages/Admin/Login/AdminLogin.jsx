import React, { useEffect, useState } from "react";
import { mountCoreUiCss, unmountCoreUiCss } from "../../../utils/coreuiCss";
import { useNavigate, Navigate } from "react-router-dom";
import authApi from "../../../api/authApi";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeNumber: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Luôn hiển thị form login khi vào /admin/login hoặc /admin/signin
  useEffect(() => {
    // Gỡ mọi lớp global có thể chặn tương tác khi chuyển trang/modal
    document.body.classList.remove(
      "page-transitioning",
      "no-scroll",
      "modal-open"
    );
    document.documentElement.classList.remove("modal-open");
    // Đảm bảo body cho phép pointer events
    const prevPointer = document.body.style.pointerEvents;
    document.body.style.pointerEvents = "auto";
    return () => {
      document.body.style.pointerEvents = prevPointer;
    };
  }, []);

  // Bật theme CoreUI + nạp CSS chỉ trong trang login; khôi phục khi rời trang
  useEffect(() => {
    mountCoreUiCss();
    const prevTheme =
      document.documentElement.getAttribute("data-coreui-theme");
    document.documentElement.setAttribute("data-coreui-theme", "light");
    return () => {
      unmountCoreUiCss();
      if (prevTheme) {
        document.documentElement.setAttribute("data-coreui-theme", prevTheme);
      } else {
        document.documentElement.removeAttribute("data-coreui-theme");
      }
    };
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!formData.employeeNumber || !formData.password) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        employeeNumber: String(formData.employeeNumber || "").trim(),
        password: String(formData.password || "").trim(),
      };
      const response = await authApi.adminSignin(payload);
      const resData = response?.data?.data;

      // ⚠️ CLEAR USER TOKENS TRƯỚC (vì chỉ cho 1 loại login tại 1 thời điểm)
      localStorage.removeItem("buyerId");
      localStorage.removeItem("sellerId");
      localStorage.removeItem("buyerAvatar");
      console.log("⚠️  [Admin Login] Cleared user-specific data");

      // Lưu admin tokens
      if (resData?.accessToken) {
        localStorage.setItem("accessToken", resData.accessToken);
        localStorage.setItem("token", resData.accessToken);
      }
      if (resData?.refreshToken) {
        localStorage.setItem("refreshToken", resData.refreshToken);
      }
      if (resData?.username) {
        localStorage.setItem("username", resData.username);
      }
      if (resData?.email) {
        localStorage.setItem("userEmail", resData.email);
      }

      // Lưu hồ sơ admin
      const adminProfile = {
        avatarUrl:
          resData?.avatarUrl || resData?.avatar_url || resData?.avatarURL,
        employeeNumber: resData?.employeeNumber || resData?.employee_number,
        fullName: resData?.fullName || resData?.full_name,
        phoneNumber: resData?.phoneNumber || resData?.phone_number,
        isSuperAdmin:
          typeof resData?.isSuperAdmin !== "undefined"
            ? resData?.isSuperAdmin
            : resData?.is_super_admin,
        email: resData?.email,
        status: resData?.status,
        gender: resData?.gender,
        createdAt: resData?.createdAt || resData?.created_at,
        updatedAt: resData?.updatedAt || resData?.updated_at,
      };
      localStorage.setItem("adminProfile", JSON.stringify(adminProfile));

      // ✅ Đánh dấu đang đăng nhập bằng tài khoản admin
      localStorage.setItem("authType", "admin");
      console.log("✅ [Admin] Login successful (authType: admin)");
      window.dispatchEvent(new CustomEvent("authStatusChanged"));
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Đăng nhập thất bại";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100 bg-body-tertiary"
      style={{ position: "relative", zIndex: 20000, pointerEvents: "auto" }}
    >
      <div className="admin-login-wrap" style={{ maxWidth: 520 }}>
        <div className="row g-0 shadow rounded overflow-hidden">
          <div className="col-12 p-5 bg-white">
            <h1 className="mb-2">Login</h1>
            <p className="text-secondary mb-4">Sign in to your admin account</p>
            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={onSubmit}>
              <div className="mb-3">
                <label className="form-label">Employee Number</label>
                <input
                  type="text"
                  className="form-control"
                  name="employeeNumber"
                  value={formData.employeeNumber}
                  onChange={onChange}
                  autoComplete="username"
                  placeholder="Employee number"
                />
              </div>
              <div className="mb-4">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  autoComplete="current-password"
                  placeholder="Password"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={loading}
              >
                {loading ? "Đang đăng nhập..." : "Login"}
              </button>
              <a
                className="ms-3 text-decoration-underline"
                href="/forgot-password"
              >
                Forgot password?
              </a>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
