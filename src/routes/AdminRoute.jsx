import React, { Suspense } from "react";
import { CSpinner } from "@coreui/react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
const CoreAdminLayout = React.lazy(() => import("../layouts/CoreAdminLayout"));
import AdminLogin from "../pages/Admin/Login/AdminLogin";
import adminViewRoutes from "./adminViewRoutes.jsx";

// ErrorBoundary component để bắt lỗi render
class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Admin layout error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 p-4">
          <h2 className="text-danger mb-3">Lỗi tải giao diện admin</h2>
          <p className="text-muted mb-4">
            Có lỗi xảy ra khi tải giao diện quản trị. Vui lòng thử lại.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
          <details className="mt-3 text-start">
            <summary className="text-muted">Chi tiết lỗi</summary>
            <pre className="mt-2 text-danger small">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function RequireAdminAuth({ children }) {
  const location = useLocation();
  const token =
    typeof window !== "undefined" &&
    (localStorage.getItem("accessToken") || localStorage.getItem("token"));
  const authType =
    typeof window !== "undefined" && localStorage.getItem("authType");

  if (!token || authType !== "admin") {
    return <Navigate to="/admin/signin" state={{ from: location }} replace />;
  }

  return children;
}

export default function AdminRoutes() {
  return (
    <Routes>
      {/* route đăng nhập admin */}
      <Route path="signin" element={<AdminLogin />} />
      <Route path="login" element={<Navigate to="/admin/signin" replace />} />

      {/* các route chính */}
      <Route
        path="/"
        element={
          <RequireAdminAuth>
            <AdminErrorBoundary>
              <Suspense
                fallback={
                  <div className="d-flex justify-content-center p-5">
                    <CSpinner color="primary" />
                  </div>
                }
              >
                <CoreAdminLayout />
              </Suspense>
            </AdminErrorBoundary>
          </RequireAdminAuth>
        }
      >
        {/* Mặc định redirect về dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        {adminViewRoutes.map((r, idx) => (
          <Route key={idx} path={r.path} element={r.element} />
        ))}
      </Route>
    </Routes>
  );
}
