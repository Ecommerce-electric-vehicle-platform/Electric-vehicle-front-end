import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import AuthLayout from "./pages/Auth/login/AuthLayout";
import PersonalProfilePage from "./components/PersonalProfilePage";
import HomePage from "./homepage/HomePage";

// Component bảo vệ route (chỉ cho vào khi đã đăng nhập)
function ProtectedRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem("token");
  const location = useLocation();

  if (!isAuthenticated) {
    // Lưu lại trang người dùng đang ở, để sau khi login xong có thể quay lại
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Mặc định chuyển về /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        {/* Trang Home */}
        <Route path="/home" element={<HomePage />} />

        {/* Trang Auth */}
        <Route path="/signin" element={<AuthLayout page="signin" />} />
        <Route path="/signup" element={<AuthLayout page="signup" />} />

        {/* Trang Profile (phải đăng nhập mới vào được) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <PersonalProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Fallback nếu route sai */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}
